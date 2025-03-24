import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import useUserId from "../userid";
import { useRouter } from "expo-router";

export default function CropListScreen() {
  const [crops, setCrops] = useState([]);
  const userId = useUserId();
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const fetchCrops = async () => {
      try {
        const cropsRef = collection(db, "users", userId, "crop-diagnosis");
        const snapshot = await getDocs(cropsRef);
        const cropList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCrops(cropList);
      } catch (error) {
        console.error("Error fetching crops:", error);
      }
    };

    fetchCrops();
  }, [userId]);

  const openChatbot = (docId) => {
    router.push({ pathname: "/user/chatbot", params: { docId } });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={crops}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openChatbot(item.id)}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <Text style={styles.cropName}>{item.name || "Unnamed Crop"}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  cropName: {
    fontSize: 18,
    fontWeight: "bold",
    flexShrink: 1,
  },
});
