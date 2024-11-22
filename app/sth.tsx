import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function IndexPage() {
  return (
    <View style={styles.container}>
      <Text>Navigate to OTP Page:</Text>
      <Link href="/otp">
        <Text style={styles.link}>Go to OTP</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  link: { color: 'blue', fontSize: 18 },
});
