import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { router } from "expo-router";
import { auth } from "../firebase";

const CustomDrawerContent = (props: any) => {
	const [nameOfUser, setNameOfUser] = useState<string | undefined>(undefined);
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setNameOfUser(user.displayName || "");
			}
			
		});
		return () => unsubscribe();
	}, []);

	return (
		<DrawerContentScrollView
			{...props}
			contentContainerStyle={{
				flex: 1,
			}}
		>
			{/* Custom Header */}
			<View
				style={{
					backgroundColor: "#ffffff",
					padding: 20,
					alignItems: "center",
				}}
			>
				<Text
					style={{
					color: "black",
					fontSize: 18,
					fontWeight: "bold",
					}}
				>
					Hello, {nameOfUser}
				</Text>
			</View>
	
			{/* Custom Drawer Items */}
			<ScrollView
				contentContainerStyle={{
				flexGrow: 1,
				//justifyContent: "center",
				paddingHorizontal: 10,
				}}>
					{props.state.routes
						//.filter((r) => r.name != "")
						.map((route: any, index: number) => {
					const isActive = props.state.index === index; // Check if this route is active
					return (
					<TouchableOpacity
						key={route.key}
						style={[
						{
							paddingVertical: 15,
							paddingHorizontal: 10,
							borderRadius: 8,
							backgroundColor: isActive ? "#E8F5E9" : "transparent",
							marginBottom: 10,
						},
						]}
						onPress={() => props.navigation.navigate(route.name)}
					>
						<Text
						style={{
							color: isActive ? "#4CAF50" : "#000",
							fontSize: 16,
							fontWeight: isActive ? "bold" : "normal",
						}}>
							{route.name === "index" && "Home"}
                            {route.name === "crop-diagnose" && "Crop Diagnosis"}
                            {route.name === "chatbot" && "Chatbot"}
							{route.name === "oauth" && "oauth"}
							{route.name === "crops-list" && "Crops List"}
							{route.name === "profile" && "Profile"}
                            

						</Text>
					</TouchableOpacity>
					);
					})}
			</ScrollView>
			{/* Footer */}
			<View
				style={{
					borderTopWidth: 1,
					borderColor: "#ccc",
					padding: 10,
					alignItems: "center",
				}}>
				<TouchableOpacity
					style={{
					padding: 15,
					backgroundColor: "#F44336",
					borderRadius: 8,
					width: "100%",
					marginBottom: 10,
					}}
					onPress={() => {
						Alert.alert(
						  "Confirm Sign Out", // Title of the prompt
						  "Are you sure you want to sign out?", // Message
						  [
							{
							  text: "Cancel", // Cancel button
							  //onPress: () => console.log("Sign out canceled"),
							  style: "cancel",
							},
							{
							  text: "OK", // OK button
							  onPress: () => {
								signOut(auth)
								  .then(() => {
									router.replace("/");
								  })
								  .catch((error) => console.error("Sign Out Error:", error));
							  },
							},
						  ],
						  { cancelable: false } // Prevent closing the prompt by tapping outside
						);
					  }}
					>
					<Text
					style={{
						color: "#fff",
						fontSize: 16,
						textAlign: "center",
					}}>
					Sign Out
					</Text>
				</TouchableOpacity>
				<Text
					style={{
					textAlign: "center",
					color: "#7e7e7e",
					marginTop: 5,
					}}>
					Designed and Developed by Shivam
				</Text>
			</View>
		</DrawerContentScrollView>
	);
};
  

export default function Layout() {
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
		if (!user) {
			router.replace("/");
		}
		});

		return () => unsubscribe();
	}, []);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Drawer
				drawerContent={(props) => (
				<CustomDrawerContent {...props} />
				)}
				screenOptions={{
				drawerItemStyle: {
					paddingVertical: 15,
					paddingHorizontal: 10,
					borderRadius: 8,
				},
				}}
			>
				<Drawer.Screen
					name="index"
					options={{
						drawerLabel: 'Home',
						title: 'HomePage',
                        headerShown:false,
					}}
				/>
                <Drawer.Screen
					name="crop-diagnose"
					options={{
						drawerLabel: 'Crop Diagnosis',
                        title: 'Crop Diagnosis',
					}}
				/>
                <Drawer.Screen
					name="chatbot"
					options={{
						drawerLabel: 'Chatbot',
						title: 'Chatbot',
                        headerShown: false,
					}}
				/>
				<Drawer.Screen
					name="oathredirect"
					options={{
						drawerLabel: 'Oauth',
						title: 'oauth',
					}}
				/>
				<Drawer.Screen
					name="crops-list"
					options={{
						drawerLabel: 'List of Crops',
						title: 'Crops List',
					}}
				/>
				<Drawer.Screen
					name="profile"
					options={{
						drawerLabel: "profile",
						title: "Profile"
					}}
				/>
			</Drawer>
		</GestureHandlerRootView>

	);
}

const styles = StyleSheet.create({
  drawerItem: {
    padding: 15,
    marginHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
  },
  activeDrawerItem: {
    backgroundColor: "#4CAF50",
  },
  drawerItemText: {
    fontSize: 16,
    color: "#333",
  },
  activeDrawerItemText: {
    color: "#fff",
  },
});