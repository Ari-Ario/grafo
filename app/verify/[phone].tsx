import Colors from '@/constants/Colors';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const CELL_COUNT = 6;

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const Page = () => {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const [code, setCode] = useState('');
  const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({ value: code, setValue: setCode });

  useEffect(() => {
    if (code.length === 6) {
      verifyCode();
    }
  }, [code]);

  const verifyCode = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms',
      });

      if (error) {
        Alert.alert('Verification Error', error.message);
        return;
      }

      if (session) {
        await SecureStore.setItemAsync('session', JSON.stringify(session));
        router.replace('(tabs)/chats');
      } else {
        Alert.alert('Verification failed', 'Check the code and try again.');
      }
    } catch (err) {
      console.error('Unexpected error during OTP verification:', err.message);
    }
  };

  const resendCode = async () => {
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone });

      if (otpError) {
        if (otpError.message.includes('not found')) {
          console.log('User not found, attempting to sign up...');
          const { error: signUpError } = await supabase.auth.signUp({ phone, password: phone });

          if (signUpError) {
            Alert.alert('Sign-Up Error', signUpError.message);
            return;
          }
          console.log('User signed up and OTP sent.');
        } else {
          Alert.alert('Resend Error', otpError.message);
          return;
        }
      } else {
        console.log('OTP resent successfully.');
      }
    } catch (err) {
      console.error('Unexpected error resending OTP:', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: phone }} />
      <Text style={styles.legal}>We have sent you an SMS with a code to the number above.</Text>
      <Text style={styles.legal}>Enter the 6-digit activation code.</Text>

      <CodeField
        ref={ref}
        {...props}
        value={code}
        onChangeText={setCode}
        cellCount={CELL_COUNT}
        rootStyle={styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        renderCell={({ index, symbol, isFocused }) => (
          <View
            onLayout={getCellOnLayoutHandler(index)}
            key={index}
            style={[styles.cellRoot, isFocused && styles.focusCell]}>
            <Text style={styles.cellText}>{symbol || (isFocused ? <Cursor /> : null)}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.button} onPress={resendCode}>
        <Text style={styles.buttonText}>Didn't receive a verification code?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
    gap: 20,
  },
  legal: {
    fontSize: 14,
    textAlign: 'center',
    color: '#000',
  },
  button: {
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.primary,
    fontSize: 18,
  },
  codeFieldRoot: {
    marginTop: 20,
    width: 260,
    marginLeft: 'auto',
    marginRight: 'auto',
    gap: 4,
  },
  cellRoot: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  cellText: {
    color: '#000',
    fontSize: 36,
    textAlign: 'center',
  },
  focusCell: {
    paddingBottom: 4,
    borderBottomColor: '#000',
    borderBottomWidth: 2,
  },
});

export default Page;
