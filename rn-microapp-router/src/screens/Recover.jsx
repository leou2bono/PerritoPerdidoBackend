import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { AUTH_API } from '../api/client';

export default function Recover({ navigation }) {
  const [email, setEmail] = useState('');

  const handleRecover = async () => {
    try {
      const res = await axios.post(`${AUTH_API}/auth/recover`, { email });
      Alert.alert('Éxito', res.data.message);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo enviar el correo de recuperación');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar clave</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity style={styles.button} onPress={handleRecover}>
        <Text style={styles.buttonText}>Enviar correo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, justifyContent:'center', padding:24, backgroundColor:'#0f172a' },
  title:{ fontSize:28, color:'#e2e8f0', marginBottom:24, fontWeight:'600' },
  input:{ backgroundColor:'#1f2937', color:'#e2e8f0', padding:14, borderRadius:12, marginBottom:12 },
  button:{ backgroundColor:'#22c55e', padding:14, borderRadius:12, alignItems:'center' },
  buttonText:{ color:'#0f172a', fontWeight:'700' },
});
