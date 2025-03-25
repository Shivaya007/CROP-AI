import React, { useEffect, useState, useCallback } from "react";
import { 
  View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, RefreshControl 
} from "react-native";
import { collection, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import useUserId from "../userid";
import { useRouter } from "expo-router";

export default function CropListScreen() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = useUserId();
  const router = useRouter();

  const fetchCrops = async () => {
    if (!userId) return;
    setLoading(true);
  
    try {
      console.log("Fetching crops..."); // Debugging
      const cropsRef = collection(db, "users", userId, "crop-diagnosis");
      const cropsQuery = query(cropsRef, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(cropsQuery);
  
      const cropList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched crops:", cropList); // Debugging
  
      setCrops(cropList);
    } catch (error) {
      console.error("Error fetching crops:", error);
    }
  
    setLoading(false);
  };
  
  useEffect(() => {
    fetchCrops();
  }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCrops();
    setRefreshing(false);
  }, [userId]);

  const openChatbot = (docId) => {
    router.push({ pathname: "/user/chatbot", params: { docId } });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : (
        <FlatList
          data={crops}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openChatbot(item.id)}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              <Text style={styles.cropName}>{item.name || "Unnamed Crop"}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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