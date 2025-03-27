import React, { useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useNews } from "../useNews"; // Import the custom hook
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { Animated } from "react-native"; // Import for smooth animations
import { ToastAndroid, Platform, Alert } from "react-native";


export default function NewsScreen() {
  const [articleCount, setArticleCount] = useState(10); // Initial count
  const { news, loading, error, fetchMoreNews } = useNews(articleCount); // Custom hook with dynamic count

  const [scrollY, setScrollY] = useState(new Animated.Value(0)); // Track scroll position
  const [showScrollUp, setShowScrollUp] = useState(false);

  const flatListRef = React.useRef<FlatList>(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  scrollY.addListener(({ value }) => {
    setShowScrollUp(value > 300); // Show button after scrolling 300px
  });

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };


  const loadMore = () => {
    setArticleCount((prev) => prev + 10); // Load 10 more
    fetchMoreNews(articleCount + 10); // Fetch more news
  };

  if (loading && news.length === 0) {
    return <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />;
  }

  if (error) {
    if (Platform.OS === "android") {
      ToastAndroid.show("❌ Failed to load news!", ToastAndroid.SHORT);
    } else {
      Alert.alert("Error", "Failed to load news!");
    }
  
    return <Text style={styles.errorText}>{error}</Text>;
  }
  

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        onScroll={handleScroll}
        scrollEventThrottle={16} 
        data={news}
        keyExtractor={(item) => item.url}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.urlToImage || "https://via.placeholder.com/150" }} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description || "No description available."}</Text>
            <TouchableOpacity style={styles.readMoreButton} onPress={() => Linking.openURL(item.url)}>
              <Text style={styles.readMoreText}>Read More</Text>
            </TouchableOpacity>
          </View>
        )}
        onEndReached={loadMore} 
        onEndReachedThreshold={0.5} 
        ListFooterComponent={() => loading && <ActivityIndicator size="small" color="#4CAF50" style={styles.loader} />}
      />
      {/* Floating Scroll-Up Button */}
      {showScrollUp && (
        <TouchableOpacity style={styles.scrollUpButton} onPress={scrollToTop}>
          <Ionicons name="arrow-up" size={36} color="white" />
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f8f9fa",
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0d47a1",
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  readMoreButton: {
    marginTop: 10,
    backgroundColor: "#0d47a1",
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  readMoreText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  scrollUpButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#0d47a1",
    borderRadius: 50,
    elevation: 5,
    padding:5
  },
});
