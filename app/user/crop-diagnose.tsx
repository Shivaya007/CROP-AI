import React, { useEffect, useState } from "react";
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
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import Constants from "expo-constants";
import Header from "@/components/header";
import { useLocalSearchParams } from "expo-router"


const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY;  // Replace with your Gemini API Key


export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { openModal } = useLocalSearchParams();

  const saveImageToLocalStorage = async (uri: string) => {
    try {
      await AsyncStorage.setItem('savedImageUri', uri);
    } catch (error) {
      console.error('Error saving image URI to local storage:', error);
    }
  };
  useEffect(() => {
    if (openModal) {
      setModalVisible(true);
    }
  }, [openModal]);  // Add openModal to the dependency array
  

  const uploadToGemini = async (imageUri: string) => {
    setLoading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

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
                // { text: "Analyze this crop for diseases and provide basic details." },
                { text: "Analyze this crop and give the crop name, the diseses it has and how to cure it and list of medicines which could be possibly used to cure it. Give in short only" },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      const aiResponse = response.data; // Store AI response

      setLoading(false);
      router.push({
        pathname: "/user/chatbot",
        params: { imageUri, aiResponse: JSON.stringify(aiResponse) },
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      setLoading(false);
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
      saveImageToLocalStorage(result.assets[0].uri); // Save the image URI
      uploadToGemini(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setModalVisible(true)}
        >
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

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => pickImage("camera")}
            >
              <Ionicons name="camera-outline" size={24} color="black" />
              <Text style={styles.optionText}>Take a Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => pickImage("gallery")}
            >
              <Ionicons name="images-outline" size={24} color="black" />
              <Text style={styles.optionText}>Upload from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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