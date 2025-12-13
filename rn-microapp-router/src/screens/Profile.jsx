// src/screens/Profile.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import client, { PROFILE_API } from '../api/client';
import colors from '../theme/colors';

export default function Profile({ onLogout }) {
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [fotoBase64, setFotoBase64] = useState(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    (async () => {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      const loc = await Location.requestForegroundPermissionsAsync();
      if (cam.status !== 'granted' || loc.status !== 'granted') {
        Alert.alert('Permisos', 'Se requieren permisos de cámara y ubicación');
      }
    })();
  }, []);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });
    if (!res.canceled) setFotoBase64(res.assets[0].base64);
  };

  const getLocation = async () => {
    const pos = await Location.getCurrentPositionAsync({});
    setCoords({ lng: pos.coords.longitude, lat: pos.coords.latitude });
  };

  const saveProfile = async () => {
    if (!coords) return Alert.alert('Falta ubicación', 'Obtén tu ubicación antes de guardar.');
    try {
      const body = {
        nombre,
        fechaNacimiento,
        fotoBase64,
        geo: { type: 'Point', coordinates: [coords.lng, coords.lat] },
      };
      await client.post(`${PROFILE_API}/profiles`, body);
      Alert.alert('Guardado', 'Perfil almacenado');
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el perfil');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>
      <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={colors.subtext} value={nombre} onChangeText={setNombre} />
      <TextInput style={styles.input} placeholder="Fecha nacimiento (YYYY-MM-DD)" placeholderTextColor={colors.subtext} value={fechaNacimiento} onChangeText={setFechaNacimiento} />
      <View style={styles.row}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={pickImage}><Text style={styles.buttonTextDark}>Seleccionar foto</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={getLocation}><Text style={styles.buttonTextDark}>Obtener ubicación</Text></TouchableOpacity>
      </View>
      {fotoBase64 && <Image source={{ uri: `data:image/jpeg;base64,${fotoBase64}` }} style={styles.image} />}
      {coords && <Text style={styles.info}>Ubicación: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</Text>}
      <TouchableOpacity style={styles.button} onPress={saveProfile}><Text style={styles.buttonText}>Guardar</Text></TouchableOpacity>
      <TouchableOpacity style={styles.logout} onPress={onLogout}><Text style={styles.logoutText}>Cerrar sesión</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:24, backgroundColor: colors.bg },
  title:{ fontSize:24, color: colors.text, marginBottom:16, fontWeight:'600' },
  input:{ backgroundColor: colors.card, color: colors.text, padding:14, borderRadius:12, marginBottom:12, borderWidth:1, borderColor: colors.border },
  row:{ flexDirection:'row', gap:12, marginVertical:8 },
  button:{ backgroundColor: colors.primary, padding:14, borderRadius:12, marginTop:16, alignItems:'center' },
  buttonText:{ color: colors.bg, fontWeight:'700' },
  buttonSecondary:{ backgroundColor: colors.secondary, padding:12, borderRadius:12 },
  buttonTextDark:{ color: colors.bg, fontWeight:'700' },
  image:{ width:'100%', height:200, borderRadius:12, marginTop:12 },
  info:{ color: colors.subtext, marginTop:8 },
  logout:{ marginTop:16, alignItems:'center' },
  logoutText:{ color: colors.danger, fontWeight:'600' },
});
