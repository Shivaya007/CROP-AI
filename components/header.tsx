import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title, menuButton = true }) => {
  const navigation = useNavigation();

  return (
    <LinearGradient colors={["#0d47a1", "#1e88e5"]} style={styles.header}>
      {menuButton &&
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={33} color="white" />
        </TouchableOpacity>
      }
      <Text style={styles.headerTitle}>{title}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 15,
    paddingBottom: 15,
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
});

export default Header;
