// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Login from './src/screens/Login';
import Register from './src/screens/Register';
import Profile from './src/screens/Profile';
import Index from './src/screens/Index';
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerMenu({ onLogout }) {
  return (
    <Drawer.Navigator>
      <Stack.Screen name="Index" component={Index} />
      <Drawer.Screen name="Profile" component={Profile} options={{ title: 'Crear Perfil' }} />
      <Drawer.Screen name="Logout">
        {() => <LogoutScreen onLogout={onLogout} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

function LogoutScreen({ onLogout }) {
  React.useEffect(() => {
    onLogout();
  }, []);
  return null;
}

export default function App() {
  const [auth, setAuth] = useState(null);

  useEffect(() => { AsyncStorage.getItem('access').then(setAuth); }, []);

  return (
    <NavigationContainer>
      {auth ? (
        <DrawerMenu onLogout={() => setAuth(false)} />
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login">
            {(props) => <Login {...props} onAuth={() => setAuth(true)} />}
          </Stack.Screen>
          <Stack.Screen name="Register" component={Register} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
