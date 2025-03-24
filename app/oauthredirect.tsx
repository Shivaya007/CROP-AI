import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, View, Text } from "react-native";

const OAuthRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the home page after OAuth login

    router.replace("/user"); 

  }, []);
  

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#1e88e5" />
      <Text>Redirecting...</Text>
    </View>
  );
};

export default OAuthRedirect;
