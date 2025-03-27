import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import { collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import useUserId from "../userid";
import { useRouter } from "expo-router";

export default function CropListScreen() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedToDos, setSelectedToDos] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [loadingToDo, setLoadingToDo] = useState(null); // Track loading state for each crop
  const userId = useUserId();
  const router = useRouter();

  const fetchCrops = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const cropsRef = collection(db, "users", userId, "crop-diagnosis");
      const cropsQuery = query(cropsRef, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(cropsQuery);

      const cropList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

  const openToDoModal = async (docId) => {
    setLoadingToDo(docId); 
    try {
      const todosRef = collection(db, "users", userId, "crop-diagnosis", docId, "todos");
      const snapshot = await getDocs(todosRef);
      const todosList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      todosList.sort((a, b) => a.index - b.index); // Ensure ordered list
      setSelectedToDos(todosList);
      setSelectedDocId(docId);
      setModalVisible(true);
    } catch (error) {
      console.error("Error fetching to-do list:", error);
    }
    setLoadingToDo(null); 
  };

  const toggleToDoStatus = async (todoId, currentStatus) => {
    if (!selectedDocId) return;

    const todoRef = doc(db, "users", userId, "crop-diagnosis", selectedDocId, "todos", todoId);
    await updateDoc(todoRef, { done: !currentStatus });

    setSelectedToDos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === todoId ? { ...todo, done: !currentStatus } : todo
      )
    );
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
            <View style={styles.card}>
              {/* Crop Image & Name */}
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              <Text style={styles.cropName}>{item.name || "Unnamed Crop"}</Text>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.chatButton} onPress={() => openChatbot(item.id)}>
                  <Text style={styles.buttonText}>Open Chatbot</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.todoButton, 
                    { backgroundColor: loadingToDo === item.id ? "#ccc" : "#4CAF50" } // Grey when loading, green otherwise
                  ]} 
                  onPress={() => openToDoModal(item.id)} 
                  disabled={loadingToDo === item.id}
                >
                  <Text style={styles.buttonText}>
                    {loadingToDo === item.id ? "Loading..." : "View To-Do"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal for To-Do List */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>To-Do List</Text>

            {selectedToDos.length === 0 ? (
              <Text style={styles.emptyText}>No tasks available.</Text>
            ) : (
              <FlatList
                data={selectedToDos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.todoItem}
                    onPress={() => toggleToDoStatus(item.id, item.done)}
                  >
                    <View style={[styles.checkbox, item.done && styles.checkedBox]}>
                      {item.done && <Text style={styles.checkmark}>✔</Text>}
                    </View>
                    <Text style={[styles.todoText, item.done && styles.completedText]}>
                      {item.day}: {item.text}
                    </Text>
                  </Pressable>
                )}
              />
            )}

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 20 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  },
  image: { width: "100%", height: 150, borderRadius: 10 },
  cropName: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginVertical: 8 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 10 },
  chatButton: { backgroundColor: "#007bff", padding: 10, borderRadius: 5 },
  todoButton: { backgroundColor: "#28a745", padding: 10, borderRadius: 5 },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  modalOverlay: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)"},
  modalContent: { backgroundColor: "#fff", margin: 20, padding: 20, borderRadius: 10, marginTop:80, marginBottom:80 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  todoItem: { flexDirection: "row", alignItems: "center", padding: 5 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#4CAF50",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: { backgroundColor: "#4CAF50" },
  checkmark: { color: "#fff", fontWeight: "bold" },
  todoText: { fontSize: 16, marginRight: 34 },
  completedText: { textDecorationLine: "line-through", color: "#6c757d" },
  closeButton: { backgroundColor: "#dc3545", padding: 10, borderRadius: 5, marginTop: 10 },
  emptyText: { textAlign: "center", color: "#6c757d" },
});