// src/screens/Login.jsx
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import colors from '../theme/colors';
import { AUTH_API } from '../api/client';

const schema = yup.object({
  email: yup.string().email('Email inválido').required('Email requerido'),
  password: yup.string().min(8, 'Mínimo 8 caracteres').required('Password requerido'),
});

export default function Login({ navigation, onAuth }) {
  const { control, handleSubmit } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const res = await axios.post(`${AUTH_API}/auth/login`, data);
      await AsyncStorage.multiSet([
        ['access', res.data.access],
        ['refresh', res.data.refresh],
      ]);
      onAuth(res.data.access);
    } catch (e) {
      Alert.alert('Error', 'Credenciales inválidas');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      <Controller name="email" control={control} defaultValue="" render={({ field: { onChange, value } }) => (
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.subtext} autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} />
      )}/>
      <Controller name="password" control={control} defaultValue="" render={({ field: { onChange, value } }) => (
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.subtext} secureTextEntry value={value} onChangeText={onChange} />
      )}/>
      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Crear cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:24, backgroundColor: colors.bg },
  title: { fontSize:28, color: colors.text, marginBottom:24, fontWeight:'600' },
  input: { backgroundColor: colors.card, color: colors.text, padding:14, borderRadius:12, marginBottom:12, borderWidth:1, borderColor: colors.border },
  button: { backgroundColor: colors.primary, padding:14, borderRadius:12, alignItems:'center', marginTop:6 },
  buttonText: { color: colors.bg, fontWeight:'700' },
  link: { color: colors.secondary, marginTop:16, textAlign:'center' },
});
