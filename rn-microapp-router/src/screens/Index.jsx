// index.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Index({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a la App</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.buttonTextDark}>Crear cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0f172a' },
  title:{ fontSize:28, color:'#e2e8f0', marginBottom:24, fontWeight:'600' },
  button:{ backgroundColor:'#22c55e', padding:14, borderRadius:12, marginBottom:12, width:'80%', alignItems:'center' },
  buttonText:{ color:'#0f172a', fontWeight:'700' },
  buttonSecondary:{ backgroundColor:'#93c5fd', padding:14, borderRadius:12, width:'80%', alignItems:'center' },
  buttonTextDark:{ color:'#0f172a', fontWeight:'700' },
});
