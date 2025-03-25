import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import Header from "@/components/header";
import { useNews } from "../useNews"; // Import the news hook


const { width } = Dimensions.get("window");

export default function HomeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { news } = useNews(3); 

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Classy Header Section */}
      <Header title="Crop AI"/>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner Image */}
        <Image source={require("../../assets/images/crop-banner.png")} style={styles.bannerImage} />


        {/* Crop Analysis Steps */}
        {/* <View style={styles.stepsContainer}>
          <Text style={styles.sectionTitle}>How Crop Analysis Works?</Text>
          <View style={styles.step}>
            <Ionicons name="camera-outline" size={28} color="#0d47a1" />
            <Text style={styles.stepText}>Scan Your Crop</Text>
          </View>
          <View style={styles.step}>
            <Ionicons name="search-outline" size={28} color="#0d47a1" />
            <Text style={styles.stepText}>AI Analyzes the Image</Text>
          </View>
          <View style={styles.step}>
            <Ionicons name="bar-chart-outline" size={28} color="#0d47a1" />
            <Text style={styles.stepText}>Get Live Report</Text>
          </View>
          <View style={styles.step}>
            <Ionicons name="chatbubbles-outline" size={28} color="#0d47a1" />
            <Text style={styles.stepText}>Chat for Expert Advice</Text>
          </View>
        </View> */}

      {/* Crop Analysis Steps (Row Wise with Arrows) */}
      <View style={styles.stepsContainer}>
        <Text style={styles.sectionTitle}>How Crop Analysis Works?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsRow}>
          <View style={styles.step}>
            <Ionicons name="camera-outline" size={28} color="#0d47a1" />
            <Text style={styles.stepText}>Scan</Text>
          </View>
          <View style={styles.step}>
            <Ionicons name="search-outline" size={28} color="#0d47a1" />
            <Text style={styles.stepText}>Analyze</Text>
          </View>

          <View style={styles.step}>
            <Ionicons name="bar-chart-outline" size={28} color="#0d47a1" />
            <Text style={styles.stepText}>Report</Text>
          </View>
          <View style={styles.step}>
            <Ionicons name="chatbubbles-outline" size={28} color="#0d47a1" />
            <Text style={styles.stepText}>Chat</Text>
          </View>
        </ScrollView>
      </View>





        {/* CTA Button */}
        <TouchableOpacity 
            style={styles.button} 
            onPress={() =>  router.push({
                pathname: "/user/crop-diagnose", 
                params: { 
                  openModal: true,
                }
              })}>
          <Ionicons name="camera-outline" size={24} color="white" />
          <Text style={styles.buttonText}>Scan Your Crop</Text>
        </TouchableOpacity>
        
        {/* Features Section */}
        <Text style={styles.sectionTitle}>Why Choose Crop AI?</Text>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="leaf-outline" size={28} color="#0d47a1" />
            <Text style={styles.featureText}>Identify Crop Diseases</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="chatbubbles-outline" size={28} color="#0d47a1" />
            <Text style={styles.featureText}>AI Chatbot for Advice</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="cloud-upload-outline" size={28} color="#0d47a1" />
            <Text style={styles.featureText}>Upload & Get Insights</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="newspaper-outline" size={28} color="#0d47a1" />
            <Text style={styles.featureText}>Latest Agricultural News</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="save-outline" size={28} color="#0d47a1" />
            <Text style={styles.featureText}>Save Chat for future Reference</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="analytics-outline" size={28} color="#0d47a1" />
            <Text style={styles.featureText}>Data-Driven Recommendations</Text>
          </View>
        </View>

        <View style={{marginBottom:15}}></View>

        {/* 🔹 Latest News Section */}
        <Text style={styles.sectionTitle}>Latest Agriculture News</Text>
        {news.map((article, index) => (
          <View key={index} style={styles.newsCard}>
            <Image source={{ uri: article.urlToImage || "https://via.placeholder.com/150" }} style={styles.newsImage} />
            <Text style={styles.newsTitle}>{article.title}</Text>
          </View>
        ))}

        {/* Read More Button */}
        <TouchableOpacity style={styles.readMoreButton} onPress={() => router.push("/user/news")}>
          <Text style={styles.readMoreText}>Read More</Text>
        </TouchableOpacity>

        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: "#0d47a1",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  menuButton: {
    position: "absolute",
    left: 20,
    top: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  bannerImage: {
    width: width * 0.9,
    height: 200,
    borderRadius: 20,
    marginBottom: 20,
  },

  // stepsContainer: {
  //   width: "100%",
  //   padding: 15,
  //   backgroundColor: "#fff",
  //   borderRadius: 12,
  //   elevation: 3,
  //   shadowColor: "#000",
  //   shadowOpacity: 0.1,
  //   shadowRadius: 3,
  //   shadowOffset: { width: 0, height: 2 },
  //   marginBottom: 20,
  // },
  // step: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   paddingVertical: 8,
  // },
  // stepText: {
  //   fontSize: 16,
  //   marginLeft: 10,
  //   color: "#0d47a1",
  //   fontWeight: "600",
  // },
  
  stepsContainer: {
    width: "100%",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 20,
    alignItems: "center",
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 10, 
  },
  step: {
    alignItems: "center",
    width: Dimensions.get("window").width / 5.5, // Auto scales to fit screen width
  },
  stepText: {
    fontSize: 14,
    color: "#0d47a1",
    fontWeight: "600",
    marginTop: 5,
    textAlign: "center",
  },
  arrow: {
    marginHorizontal: 5, 
  },
  
  




  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0d47a1",
    marginBottom: 10,
  },
  featuresContainer: {
    width: "100%",
    padding: 10,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    marginVertical: 5,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  featureText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#0d47a1",
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d47a1",
    padding: 15,
    borderRadius: 30,
    marginTop: 0,
    marginBottom: 20,
    width: width * 0.8,
    justifyContent: "center",
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  newsCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    width: "100%",
  },
  newsImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0d47a1",
  },
  readMoreButton: {
    marginTop: 10,
    backgroundColor: "#0d47a1",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    width: "100%",
  },
  readMoreText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
