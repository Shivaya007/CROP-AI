import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import Header from "@/components/header";
import { useLocalSearchParams } from "expo-router";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
import useUserId from "../userid";
import { TextInput } from "react-native-gesture-handler";

const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY;

export default function HomeScreen() {
  const inputRef = useRef(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { openModal } = useLocalSearchParams();
  const userId = useUserId();
  const [cropTitle, setCropTitle] = useState("");
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [imageResult, setImageResult] = useState(null);
  const [pendingDocId, setPendingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (openModal) {
      setModalVisible(true);
    }
  }, [openModal]);


  const uploadToGemini = async (imageUri: string) => {
    setLoading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: "base64" });

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64,
                  },
                },
                { text: "Analyze this crop and provide the name, diseases, and possible treatments, provide a short report of 50 words only in points." },
              ],
            },
          ],
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const aiResponse = response.data;
      const docId = await uploadImageAndSaveData(imageUri, aiResponse);
      
      setLoading(false);
      setCropTitle("");
      setImageUri(null);
      setPendingDocId(docId);
      setTitleModalVisible(false);
      setModalVisible(false);

      
      router.push({ pathname: "/user/chatbot", params: { docId } });
    } catch (error) {
      console.error("Error uploading image:", error);
      setLoading(false);
    }
  };


  const uploadImageAndSaveData = async (imageUri: string, aiResponse: any) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const imageRef = ref(storage, `images/${Date.now()}.jpg`);
      
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      const docRef = await addDoc(collection(db, "users", userId, "crop-diagnosis"), {
        imageUrl: downloadURL,
        aiResponse: aiResponse,
        timestamp: new Date(),
        name : cropTitle,
      });


      const aiReply = {
        role: "model",
        parts: [{ text: `**AI Analysis:**\n\n${aiResponse.candidates[0]?.content?.parts[0]?.text || "Analysis not available."}` }],
        timestamp: new Date(), // Use Firestore timestamp for consistency
      };
      
      await addDoc(collection(db, "users", userId, "crop-diagnosis", docRef.id, "messages"), aiReply);

      return docRef.id; // Return the document ID
    } catch (error) {
      console.error("Error uploading to Firebase:", error);
      return null;
    }
  };

  const pickImage = async (source: "gallery" | "camera") => {
    setModalVisible(false);
    let result;
    if (source === "gallery") {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
    } else {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });
    }

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageResult(result.assets[0].uri);
      setTitleModalVisible(true);
    }
  };

  const handleTitleSubmit = async () => {
   if (!cropTitle) return;
    setTitleModalVisible(false);
    uploadToGemini(imageResult);
  };


  useEffect(() => {
    if (titleModalVisible && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100); // Small delay to ensure modal animation completes
    }
  }, [titleModalVisible]);

  return (
    <View style={styles.container}>

      {cropTitle && !titleModalVisible && <Text style={{fontSize:20, fontStyle:"italic", marginBottom:18}}>{cropTitle}</Text>}
      
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
          <Ionicons name="image-outline" size={24} color="white" />
          <Text style={styles.buttonText}>Select Image</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose an Option</Text>

            <TouchableOpacity style={styles.optionButton} onPress={() => pickImage("camera")}>
              <Ionicons name="camera-outline" size={24} color="black" />
              <Text style={styles.optionText}>Take a Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={() => pickImage("gallery")}>
              <Ionicons name="images-outline" size={24} color="black" />
              <Text style={styles.optionText}>Upload from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={titleModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Crop Title</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Enter Crop Name"
              value={cropTitle}
              onChangeText={setCropTitle}
            />
            <TouchableOpacity style={styles.button} onPress={handleTitleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  input: { width: "100%", padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 5, marginBottom: 15 },
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F7FA", padding: 20 },
  image: { width: 200, height: 200, borderRadius: 10, marginBottom: 20 },
  button: { flexDirection: "row", backgroundColor: "#4CAF50", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, alignItems: "center", gap: 10, elevation: 3 },
  buttonText: { fontSize: 18, fontWeight: "bold", color: "white" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", backgroundColor: "white", borderRadius: 10, padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  optionButton: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 20, width: "100%", justifyContent: "flex-start", borderBottomWidth: 1, borderBottomColor: "#ddd" },
  optionText: { fontSize: 18, marginLeft: 10 },
  cancelButton: { marginTop: 10, paddingVertical: 10, width: "100%", alignItems: "center" },
  cancelText: { fontSize: 18, fontWeight: "bold", color: "#FF3B30" },
});

