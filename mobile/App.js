// Solo los pesos que usa la app (importar el paquete entero incluiria todas las variantes).
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Camera, Compass, Map, Route, User } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Logo from './src/components/Logo';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import AuthScreen from './src/screens/AuthScreen';
import DestinationScreen from './src/screens/DestinationScreen';
import HomeScreen from './src/screens/HomeScreen';
import IntroScreen from './src/screens/IntroScreen';
import MapScreen from './src/screens/MapScreen';
import NewTripScreen from './src/screens/NewTripScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ScanScreen from './src/screens/ScanScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';
import TripsScreen from './src/screens/TripsScreen';
import { colors, fonts } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.ink900, card: colors.ink950, primary: colors.mint, text: colors.textOnDark, border: colors.ink700 },
};

const TABS = [
  { name: 'Explorar', component: HomeScreen, Icon: Compass },
  { name: 'Mapa', component: MapScreen, Icon: Map },
  { name: 'Escanear', component: ScanScreen, Icon: Camera },
  { name: 'Viajes', component: TripsScreen, Icon: Route },
  { name: 'Perfil', component: ProfileScreen, Icon: User },
];

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: colors.textOnDarkMuted,
        tabBarStyle: { backgroundColor: colors.ink950, borderTopColor: colors.ink700 },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
      }}
    >
      {TABS.map(({ name, component, Icon }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{ tabBarIcon: ({ color, focused, size }) => <Icon color={color} size={size - 2} strokeWidth={focused ? 2.4 : 2} /> }}
        />
      ))}
    </Tab.Navigator>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink900, gap: 24 }}>
      <Logo size={72} />
      <ActivityIndicator color={colors.mint} />
    </View>
  );
}

function Root() {
  const { user, checking, introSeen } = useAuth();
  if (checking) return <Loading />;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.ink900 } }}>
      {!user ? (
        <Stack.Screen name="Bienvenida" component={AuthScreen} options={{ animation: 'fade' }} />
      ) : !introSeen ? (
        <Stack.Screen name="Intro" component={IntroScreen} options={{ animation: 'fade' }} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={Tabs} options={{ animation: 'fade' }} />
          <Stack.Screen name="Destino" component={DestinationScreen} />
          <Stack.Screen name="NuevoViaje" component={NewTripScreen} />
          <Stack.Screen name="Viaje" component={TripDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {!fontsLoaded && !fontError ? (
        <View style={{ flex: 1, backgroundColor: colors.ink900 }} />
      ) : (
        <ToastProvider>
          <AuthProvider>
            <NavigationContainer theme={navTheme}>
              <Root />
            </NavigationContainer>
          </AuthProvider>
        </ToastProvider>
      )}
    </SafeAreaProvider>
  );
}
