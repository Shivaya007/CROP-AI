import { useState, useEffect } from "react";
import { Text, View, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { onAuthStateChanged, User, sendEmailVerification, updateProfile } from "firebase/auth";
import { auth } from "../firebase";

export default function Index() {
	const [user, setUser] = useState<User | null>(null);
	const [displayName, setDisplayName] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [emailVerified, setEmailVerified] = useState<boolean>(false);
	const [isSaveButtonActive, setIsSaveButtonActive] = useState(false);

	// Listen for authentication state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			if (currentUser) {
				setUser(currentUser);
				setDisplayName((prev) => prev || currentUser.displayName || "");
				setEmail(currentUser.email || "");
				setEmailVerified(currentUser.emailVerified);
			}
		});
		return () => unsubscribe();
	}, []);

	// Track changes to enable/disable save button
	useEffect(() => {
		const hasChanges = displayName !== user?.displayName;
		setIsSaveButtonActive(hasChanges);
	}, [displayName]);

	// Handle email verification
	const handleEmailVerification = () => {
		if (user && !user.emailVerified) {
			sendEmailVerification(user)
				.then(() => Alert.alert("Verification", "Verification email sent!"))
				.catch(() => Alert.alert("Error", "Failed to send verification email."));
		}
	};

	// Save updated profile information
	const handleSave = () => {
		if (user) {
			if (displayName !== user.displayName) {
				updateProfile(user, { displayName: displayName || "" })
					.then(() => {
						Alert.alert("Profile Updated", "Display Name updated successfully!");
						setIsSaveButtonActive(false); // Disable save button after successful save
					})
					.catch(() => Alert.alert("Error", "Failed to update display name."));
			}
		}
	};

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				paddingHorizontal: 20,
			}}
		>
			{user && (
				<View
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						justifyContent: "flex-start",
						paddingTop: 20,
					}}
				>
					<View>
						<Text style={{ marginVertical: 0, fontSize: 16, fontWeight: "bold" }}>
							Display Name:
						</Text>
						<TextInput
							style={{
								borderBottomWidth: 1,
								width: "100%",
								padding: 10,
								marginBottom: 20,
							}}
							value={displayName}
							onChangeText={setDisplayName}
						/>
					</View>

					<View>
						<Text style={{ marginVertical: 0, fontSize: 16, fontWeight: "bold" }}>Email:</Text>
						<TextInput
							style={{
								borderBottomWidth: 1,
								width: "100%",
								padding: 10,
								marginBottom: 20,
							}}
							value={email}
							editable={false}
						/>
					</View>

					<Text style={{ marginVertical: 0, fontSize: 16, fontWeight: "bold" }}>
						Email Verified:
					</Text>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							width: "100%",
							marginBottom: 20,
						}}
					>
						<TextInput
							style={{
								borderBottomWidth: 1,
								width: "80%",
								padding: 10,
								marginRight: 10,
								textAlign: "center",
								flex: 1,
							}}
							value={emailVerified ? "Verified" : "Not Verified"}
							editable={false}
						/>
						{!emailVerified && (
							<TouchableOpacity style={{ borderRadius: 20 }} onPress={handleEmailVerification}>
								<Button title="Verify" onPress={handleEmailVerification} />
							</TouchableOpacity>
						)}
					</View>

					<TouchableOpacity onPress={handleSave} disabled={!isSaveButtonActive}>
						<View
							style={{
								backgroundColor: isSaveButtonActive ? "#007bff" : "#cccccc",
								padding: 15,
								width: "100%",
								borderRadius: 8,
								alignItems: "center",
								opacity: isSaveButtonActive ? 1 : 0.5,
							}}
						>
							<Text
								style={{
									color: "#fff",
									fontSize: 18,
									fontWeight: "bold",
								}}
							>
								Save
							</Text>
						</View>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}