import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Image } from 'react-native';
import { Avatar, Card, Text, TouchableRipple } from 'react-native-paper';
import client, { PROFILE_API } from '../api/client';

export default function Menu() {
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfiles = async () => {
    try {
      const res = await client.get(`${PROFILE_API}/profiles`);
      setProfiles(res.data);
    } catch (e) {
      console.log('Error cargando perfiles', e.message);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <TouchableRipple onPress={() => setSelected(item)} style={styles.item}>
      <View style={styles.row}>
        <Avatar.Image size={64} source={{ uri: `data:image/jpeg;base64,${item.fotoBase64}` }} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.nombre}</Text>
          <Text style={styles.date}>
            Ingreso: {new Date(item.fechaActual).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableRipple>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {selected && (
        <Card style={styles.card}>
          <Card.Title
            title={selected.nombre}
            subtitle={`Ingreso: ${new Date(selected.fechaActual).toLocaleDateString()}`}
            left={(props) => (
              <Avatar.Image
                {...props}
                source={{ uri: `data:image/jpeg;base64,${selected.fotoBase64}` }}
              />
            )}
          />
          <Card.Content>
            <Image
              source={{ uri: `data:image/jpeg;base64,${selected.fotoBase64}` }}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.detail}>Nombre: {selected.nombre}</Text>
            <Text style={styles.detail}>
              Fecha nacimiento: {new Date(selected.fechaNacimiento).toLocaleDateString()}
            </Text>
            <Text style={styles.detail}>
              Fecha actual: {new Date(selected.fechaActual).toLocaleDateString()}
            </Text>
          </Card.Content>
          <Card.Actions>
            <TouchableRipple onPress={() => setSelected(null)}>
              <Text style={styles.close}>Cerrar</Text>
            </TouchableRipple>
          </Card.Actions>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0f172a', padding:16 },
  row: { flexDirection:'row', alignItems:'center' },
  item: { marginBottom:12, backgroundColor:'#1f2937', borderRadius:12, padding:8 },
  info: { marginLeft:12 },
  name: { color:'#e2e8f0', fontSize:18, fontWeight:'600' },
  date: { color:'#94a3b8', fontSize:14 },
  card: { marginTop:16, backgroundColor:'#1f2937' },
  image: { width:'100%', height:200, borderRadius:12, marginBottom:12 },
  detail: { color:'#e2e8f0', marginBottom:8 },
  close: { color:'#fca5a5', marginTop:8 },
});
