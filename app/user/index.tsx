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

const { width } = Dimensions.get("window");

export default function HomeScreen() {
    const router = useRouter();
    const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Classy Header Section */}
      <Header title="Crop AI"/>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner Image */}
        <Image source={require("../../assets/images/crop-banner.png")} style={styles.bannerImage} />

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
    marginTop: 20,
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
});
