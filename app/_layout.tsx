import { router, Stack } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "./firebase";

export default function RootLayout() {

	
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				router.replace("/user");
			}
		});
		return () => unsubscribe();
	}, []);

  	return (
  		<Stack screenOptions={{headerShown:false}} />
	);
}
