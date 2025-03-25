import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { BlurView } from "expo-blur";
import Header from "@/components/header";
import Constants from "expo-constants";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import useUserId from "../userid";
import AsyncStorage from "@react-native-async-storage/async-storage";



const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY;
const { width } = Dimensions.get("window");

export default function ChatbotScreen() {
  const { docId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef();
  const userId = useUserId();
  const [cropName, setCropName] = useState("");
  const router = useRouter();


  useEffect(() => {
    const storeDocId = async () => {
      if (docId) {
        await AsyncStorage.setItem("lastDocId", docId);
      }
    };
    storeDocId();
  }, [docId]);

  useEffect(() => {
    const fetchStoredDocId = async () => {
      if (!docId) {
        const storedDocId = await AsyncStorage.getItem("lastDocId");
        if (storedDocId) {
          router.replace({ pathname: "/user/chatbot", params: { docId : storedDocId} });
        }
      }
    };
  
    fetchStoredDocId();
  }, [docId]);


  useEffect(() => {
    if (!docId || !userId) return;

    const fetchImageUrl = async () => {
      try {
        const docRef = doc(db, "users", userId, "crop-diagnosis", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.imageUrl) {
            setImageUrl(data.imageUrl);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }).start();
          }
          if (data.name){
            setCropName(data.name);
          }
        } else {
          console.error("Document not found!");
        }
      } catch (error) {
        console.error("Error fetching image URL from Firestore:", error);
      }
    };

    fetchImageUrl();
  }, [docId, userId]);

  useEffect(() => {
    if (!docId || !userId) return;

    const messagesRef = collection(
      db,
      "users",
      userId,
      "crop-diagnosis",
      docId,
      "messages"
    );

    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(fetchedMessages);

      // Auto-scroll if the user was already near the bottom
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    });

    return () => unsubscribe();
  }, [docId, userId]);

  const sendMessage = async () => {
    if (!input.trim() || !docId || !userId) return;

    const newUserMessage = {
      role: "user",
      parts: [{ text: input.trim() }],
      timestamp: serverTimestamp(),
    };

    setInput("");
    setLoading(true);

    try {
      const messagesRef = collection(
        db,
        "users",
        userId,
        "crop-diagnosis",
        docId,
        "messages"
      );

      await addDoc(messagesRef, newUserMessage);

      const formattedMessages = messages.map((msg) => ({
        role: msg.role,
        parts: msg.parts,
      }));

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [...formattedMessages, { role: "user", parts: [{ text: input.trim() }] }],
        }
      );

      const aiReplyText =
        response.data.candidates[0]?.content?.parts[0]?.text || "No response from AI.";

      const aiReply = {
        role: "model",
        parts: [{ text: aiReplyText }],
        timestamp: serverTimestamp(),
      };

      await addDoc(messagesRef, aiReply);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setLoading(false);
  };

  if (!docId) { 
    return (
      <View style={styles.container}>
        <Header title="ChatBot" />
        <Text style={{ textAlign: "center", marginTop: 20, fontSize:18}}>
          No Image Uploaded for Analysis
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header title="ChatBot" />

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatBox}
        contentContainerStyle={styles.chatBoxContent}
        keyboardShouldPersistTaps="handled"
      >
        {cropName && 
            <Text style={{fontWeight:"bold", textAlign:'center', fontSize:24, marginBottom:10}}>
              {cropName}
            </Text>
        }

        {imageUrl && (
          <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUrl }} style={styles.image} />
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>ANALYSIS</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {messages.map((msg, i) => (
          <View key={i} style={[styles.messageContainer, msg.role === "model" ? styles.aiMessage : styles.userMessage]}>
            <View
              style={[
                styles.messageContent,
                msg.role === "model" ? { shadowColor:'blue' } : { shadowColor:'gray' },
              ]}
            >
              {/* ✅ Markdown Support for Message Formatting */}
              <Markdown style={msg.role === "model" ? styles.aiMarkdown : styles.userMarkdown}>
                {msg.parts[0].text}
              </Markdown>
            </View>
            {msg.role === "model" && (
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>AI</Text>
              </View>
            )}
          </View>
        ))}

      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <BlurView intensity={80} tint="light" style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your crop..."
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}


const styles = StyleSheet.create({
  // Existing styles...
  aiMarkdown: {
    body: { fontSize: 16, lineHeight: 24 },
    text: { color: "#263238" }, // Default text color for AI
    strong: { fontWeight: "bold" }, // **Bold**
    em: { fontStyle: "italic" }, // *Italic*
    link: { color: "#3949ab", textDecorationLine: "underline" },
  },

  userMarkdown: {
    body: { fontSize: 16, lineHeight: 24 },
    text: { color: "#263238" }, // Default text color for User
    strong: { fontWeight: "bold" }, // **Bold**
    em: { fontStyle: "italic" }, // *Italic*
    link: { color: "#ffeb3b", textDecorationLine: "underline" }, // Markdown links
  },
  menuButton: {
    position: "absolute",
    left: 15,
    top: Platform.OS === "ios" ? 50 : 25,
    padding: 0,
    marginBottom:10,
    zIndex: 10, // Ensure it's above other elements
    marginTop:-10,
  },
  
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa",
  },

  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#3949ab", // Ensures shadow visibility
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5, // Android shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, 
    shadowRadius: 4,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },

  chatBox: { 
    flex: 1,
    paddingHorizontal: 16,
  },

  chatBoxContent: { 
    paddingTop: 10,
    paddingBottom: 10, 
  },

  imageContainer: { 
    alignItems: "center", 
    marginBottom: 25,
  },

  imageWrapper: {
    width: width * 0.9,
    borderRadius: 18,
    backgroundColor: "#ffffff", // Ensure shadow is visible
    overflow: "hidden",
    elevation: 6, // Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  image: { 
    width: "100%", 
    height: 240, 
    borderRadius: 18,
  },

  imageBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  imageBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  messageContainer: {
    maxWidth: "85%",
    marginBottom: 20,
    flexDirection: "row",
  },

  messageContent: {
    borderRadius: 22,
    padding: 16,
    paddingTop:2,
    paddingBottom:2,
    backgroundColor: "#ffffff", // Background ensures shadow effect
    elevation: 3, // Android
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowColor: "blue",
  },

  aiMessage: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "flex-end",
  },

  userMessage: {
    alignSelf: "flex-end",
    borderRadius: 22,
    maxWidth: "75%", // Ensures it doesn't stretch too wide
    marginBottom: 10,
    elevation: 4,
    shadowColor: "gray",
  },

  userMessageText: {
    fontSize: 16,
    lineHeight: 22,
  },

  aiMessageText: {
    color: "#263238",
  },

  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3949ab",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  aiAvatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  messageText: { 
    fontSize: 16, 
    lineHeight: 24, 
  },

  inputWrapper: {
    borderTopWidth: 1,
    borderColor: "rgba(224, 224, 224, 0.5)",
    overflow: "hidden",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 12,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
    borderColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  sendButton: {
    backgroundColor: "#3949ab",
    padding: 16,
    borderRadius: 24,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    elevation: 6, // Android
    shadowColor: "#3949ab",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },

  sendButtonDisabled: {
    backgroundColor: "#bdbdbd",
    shadowColor: "#9e9e9e",
  },

  sendButtonText: { 
    color: "white", 
    fontWeight: "600", 
    fontSize: 16 
  },
});