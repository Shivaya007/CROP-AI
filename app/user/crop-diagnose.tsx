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
import { ToastAndroid, Platform, Alert } from "react-native";
import { BackHandler } from "react-native";



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
  const [retryUpload, setRetryUpload] = useState(false);
  const [isHindi, setIsHindi] = useState(false);


  useEffect(() => {
    const backAction = () => {

      if (modalVisible) {
        setModalVisible(false);
        return true;
      }
      if (titleModalVisible) {
        setTitleModalVisible(false);
        return true;
      }
      return false;
    };
  
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
  
    return () => backHandler.remove(); // Cleanup on unmount
  }, [modalVisible, titleModalVisible]);
  

  useEffect(() => {
    if (openModal) {
      setModalVisible(true);
    }
  }, [openModal]);

  const showError = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert("Error", message);
    }
  };
  

  const uploadToGemini = async (imageUri: string) => {
    setLoading(true);
    setRetryUpload(false);
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: "base64" });

      // const prompt = isHindi
      // ? "इस फसल का नाम, रोग, और संभावित उपचार दें, और बीमारियों को हल करने के लिए कार्यों की सूची बनाएं, दिन-ब-दिन योजना संक्षेप में दें, प्रत्येक बिंदु अधिकतम 20 शब्दों में।"
      // : "Analyze this crop, give its name, diseases, and possible treatments, and generate a list of to-do's to solve the diseases, Give a short day-by-day plan, Each point max 20 words.";
      
      const todo_propmt = " and also in the end give the same each to-do in for of hash-map as day wise in array list, and '~$%~' at start and end of array, before [ and after ] (strictly not that this inverted comma is not included in this symbol for distinction, and this is to add only before and end of array, and not anywhere), and give heading for this array to-do inside '~&^~'(inverted comma not included) before start and after end of the heading text,"

      const prompt = isHindi
    ? `इस फसल का नाम, रोग, और संभावित उपचार दें, और बीमारियों को हल करने के लिए कार्यों की सूची बनाएं, दिन-ब-दिन योजना संक्षेप में दें, प्रत्येक बिंदु अधिकतम 20 शब्दों में, ${todo_propmt} ,give this to-do array in hindi only।`
    : `Analyze this crop, give its name, diseases, and possible treatments, and generate a list of to-do's to solve the diseases, Give a short day-by-day plan, Each point max 20 words ${todo_propmt} .`;
  
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
                // { text: "Analyze this crop and provide the name, diseases, and possible treatments, provide a short report of 50 words only in points." },
                // { text: "Analyze this crop give it's name, diseases, and possible treatments, and generate a list of to-do's in order to solve the diseases, give a day by day plan in short only, Each point in max 20 words, in respone give only list of to-do's no other text, Give response in hindi language." },
                { text: prompt },
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
      // console.log(aiResponse.candidates[0]?.content?.parts[0]?.text);
      
      setLoading(false);
      setCropTitle("");
      setImageUri(null);
      setPendingDocId(docId);
      setTitleModalVisible(false);
      setModalVisible(false);

      
      router.push({ pathname: "/user/chatbot", params: { docId } });
    } catch (error) {
      console.error("Error uploading image:", error);
      showError("Failed to analyze the image. Please try again.");
      setLoading(false);
      setRetryUpload(true); 
    }
  };


  const uploadImageAndSaveData = async (imageUri: string, aiResponse: any) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const imageRef = ref(storage, `images/${Date.now()}.jpg`);

      // Extract AI response text
      let aiText = aiResponse.candidates[0]?.content?.parts[0]?.text || "Analysis not available.";

      // Extract to-do section using markers
      let todosArray: { day: string; text: string; done: boolean }[] = [];

      const todoMatch = aiText.match(/~\$%~\s*\[\s*(.*?)\s*\]\s*~\$%~/s); // Extract content inside [$%~ ~%$]
      const headingMatch = aiText.match(/~&^~(.*?)~&^~/s); // Extract heading text

      if (todoMatch && todoMatch[1]) {
        try {
          const todos = JSON.parse(`[${todoMatch[1]}]`); // Ensure valid JSON format
          
          todosArray = todos.map((item: any, index: number) => {
            const dayKey = Object.keys(item)[0]; // Extracts "Day 1", "Day 2", etc.
            return {
              index: index + 1,
              day: dayKey, // Stores only day number
              text: item[dayKey], // Task description
              done: false, // Default: not completed
            };
          });
        } catch (err) {
          console.error("Error parsing to-do list:", err);
        }
      }

      // Remove to-do array & heading from the AI response text before saving
      aiText = aiText
      .replace(/~&\^~.*?~&\^~/s, "") // Remove the heading part
      .replace(/~\$%~.*?~\$%~/s, "") // Remove the to-do list array
      .trim();


      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      const docRef = await addDoc(collection(db, "users", userId, "crop-diagnosis"), {
        imageUrl: downloadURL,
        aiResponse: aiResponse,
        timestamp: new Date(),
        name : cropTitle,
      });

       // Save extracted to-dos in a separate collection
      if (todosArray.length > 0) {
        for (const todo of todosArray) {
          await addDoc(collection(db, "users", userId, "crop-diagnosis", docRef.id, "todos"), todo);
        }
      }


      // const aiReply = {
      //   role: "model",
      //   parts: [{ text: `**AI Analysis:**\n\n${aiResponse.candidates[0]?.content?.parts[0]?.text || "Analysis not available."}` }],
      //   timestamp: new Date(), 
      // };

      // Save AI analysis message
      const aiReply = {
        role: "model",
        parts: [{ text: `**AI Analysis:**\n\n${aiText}` }], // Cleaned response
        timestamp: new Date(),
      };

      await addDoc(collection(db, "users", userId, "crop-diagnosis", docRef.id, "messages"), aiReply);

      return docRef.id; 
    } catch (error) {
      console.error("Error uploading to Firebase:", error);
      showError("Failed to save data. Check your connection and try again.");
      setRetryUpload(true); 
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
      setTimeout(() => inputRef.current.focus(), 100); 
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

    {retryUpload && (
      <TouchableOpacity style={styles.retryButton} onPress={() => {
        setRetryUpload(false);
        uploadToGemini(imageResult);
      }}>
        <Text style={styles.retryText}>Retry Upload</Text>
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
            <TouchableOpacity style={styles.closeButton} onPress={() => setTitleModalVisible(false)}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Enter Crop Title</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Enter Crop Name"
              value={cropTitle}
              onChangeText={setCropTitle}
            />

            {/* Language Toggle Button */}
            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleText, !isHindi && styles.activeText]}>English</Text>
              
              <TouchableOpacity
                style={[styles.toggleSlider, isHindi && styles.toggleSliderActive]}
                onPress={() => setIsHindi((prev) => !prev)}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    isHindi ? styles.toggleThumbActive : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>

              <Text style={[styles.toggleText, isHindi && styles.activeText]}>हिंदी</Text>
            </View>

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
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#0D47A1",
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    fontSize: 16,
    marginBottom: 15,
  },
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#F5F7FA", 
    padding: 20 
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#0D47A1", 
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    gap: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "white" 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 20 
  },
  optionButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    width: "100%", 
    justifyContent: "flex-start", 
    borderBottomWidth: 1, 
    borderBottomColor: "#ddd" 
  },
  optionText: { 
    fontSize: 18, 
    marginLeft: 10 
  },
  cancelButton: { 
    marginTop: 10, 
    paddingVertical: 10, 
    width: "100%", 
    alignItems: "center" 
  },
  cancelText: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#FF3B30" 
  },
  retryButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 15,
    alignItems: "center",
    elevation: 3,
  },
  retryText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
    
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom:20,
    gap: 10,
  },
  toggleSlider: {
    width: 50,
    height: 25,
    borderRadius: 15,
    backgroundColor: "#ddd",
    padding: 2,
    justifyContent: "center",
    position: "relative",
  },
  toggleSliderActive: {
    backgroundColor: "#0d47a1",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
    position: "absolute",
    top: 2.5,
  },
  toggleThumbInactive: {
    left: 3,
  },
  toggleThumbActive: {
    right: 3,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#777",
  },
  activeText: {
    fontWeight: "bold",
    color: "black",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 8,
  }
});

