import React, { useEffect, useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, StyleSheet, ImageBackground 
} from "react-native";
import { router } from "expo-router";
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  sendPasswordResetEmail, createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "./firebase";
import { FirebaseError } from "firebase/app";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import Constants from "expo-constants";
import { FontAwesome } from "@expo/vector-icons";

// Ensure Google login completes session
WebBrowser.maybeCompleteAuthSession();

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [isCreateAccount, setIsCreateAccount] = useState(false);

	// Google Auth Request
	const [request, response, promptAsync] = Google.useAuthRequest({
		clientId: Constants.expoConfig?.extra?.web_client_id,
		androidClientId: Constants.expoConfig?.extra?.android_client_id,
		iosClientId: Constants.expoConfig?.extra?.ios_client_id,
	});

	// Handle Google Sign-in response
	useEffect(() => {
		if (response?.type === "success") {
			const idToken = response.authentication?.idToken;
			if (idToken) {
				const credential = GoogleAuthProvider.credential(idToken);
				signInWithCredential(auth, credential)
					.then(() => router.replace("/user"))
					.catch((error) => setError(error.message));
			}
		}
	}, [response]);

	// Auto redirect if user is already logged in
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				router.replace("/user");
			}
		});

		return () => unsubscribe();
	}, []);

	// Handle Email & Password Login/Signup
	const handleLogin = async () => {
		if (!email || !password) {
			setError("Email and password are required!");
			return;
		}

		setError("");
		setLoading(true);

		try {
			if (isCreateAccount) {	
				await createUserWithEmailAndPassword(auth, email, password);
			} else {
				await signInWithEmailAndPassword(auth, email, password);
			}
			setEmail("");
			setPassword("");
			router.replace(isCreateAccount ? "/user/profile" : "/user");
		} catch (err) {
			if (err instanceof FirebaseError) {
				setError(err.message);
			} else {
				setError("An unexpected error occurred.");
			}
		} finally {
			setLoading(false);
		}
	};

	// Handle Password Reset
	const handlePasswordReset = async () => {
		if (!email) {
			Alert.alert("Error", "Please enter your email to reset your password.");
			return;
		}

		try {
			await sendPasswordResetEmail(auth, email);
			Alert.alert("Success", "Password reset email sent. Check your inbox!");
		} catch (err) {
			if (err instanceof FirebaseError) {
				Alert.alert("Error", err.message);
			} else {
				Alert.alert("Error", "An unexpected error occurred.");
			}
		}
	};

	return (
		<ImageBackground 
			source={require("@/assets/images/login-page-background.png")}
			style={styles.background}
			resizeMode="cover"
		>
			<View style={styles.container}>
				<View style={{display:'flex', justifyContent:'center', alignItems:'center', padding: 20}}>
					<Text style={{color:'white', fontSize:36}}>Crop AI</Text>
				</View>

				<View style={styles.content}>
					<Text style={styles.title}>Welcome Back!</Text>

					{error && <Text style={styles.errorText}>{error}</Text>}

					<TextInput
						placeholder="Email"
						style={styles.input}
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
					/>

					<TextInput
						placeholder="Password"
						secureTextEntry
						style={styles.input}
						value={password}
						onChangeText={setPassword}
					/>

					<TouchableOpacity onPress={handlePasswordReset}>
						<Text style={styles.forgotPassword}>Reset Password</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.loginButton}
						onPress={handleLogin}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>{isCreateAccount ? "Create Account" : "Login"}</Text>
						)}
					</TouchableOpacity>
					
					<View style={styles.switchAuth}>
						<Text style={{color:"white"}}>
							{isCreateAccount ? "Already have an account?" : "New User?"}
						</Text>
						<TouchableOpacity onPress={()=>setIsCreateAccount(!isCreateAccount)}>
							<Text style={styles.forgotPassword}>{isCreateAccount ? "Login" : "Create Account"}</Text>
						</TouchableOpacity>
					</View>

					<TouchableOpacity 
					style={styles.googleButton} 
					onPress={() => promptAsync()}
					activeOpacity={0.7} // Adds smooth button press effect
					>
					<View style={styles.googleButtonContent}>
						<FontAwesome name="google" size={22} color="#DB4437" style={styles.googleIcon} />
						<Text style={styles.googleButtonText}>Sign in with Google</Text>
					</View>
					</TouchableOpacity>
				</View>
			</View>
		</ImageBackground>
	);
};

const styles = StyleSheet.create({
	background: {
		flex: 1,
		width: "100%",
		height: "100%",
		position: "absolute",
	},
	container: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		marginTop:-80,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
		color: "white",
	},
	errorText: {
		color: "red",
		marginBottom: 10,
		textAlign: "center",
	},
	input: {
		width: "100%",
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		padding: 12,
		marginBottom: 15,
		backgroundColor: "rgba(255,255,255,0.8)",
		color: "black",
	},
	forgotPassword: { color: "#007bff", textAlign: "left", marginBottom: 20 },
	loginButton: { backgroundColor: "#1e88e5", padding: 15, borderRadius: 8, width: "100%" },
	buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
	switchAuth: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 20 },
	googleButton: {
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: "#DB4437",
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
		elevation: 3, // For Android shadow
	  },
	  
	  googleButtonContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	  },
	  
	  googleIcon: {
		marginRight: 10,
	  },
	  
	  googleButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
	  },
	  
});

export default LoginPage;
