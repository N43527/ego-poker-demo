// src/utils/profileService.js
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Registers a new player profile.
 * Returns true if successful, false if already exists or invalid input.
 */
export async function registerProfile(localPlayerId, playerName, passkey) {
  if (!playerName || !passkey) return { success: false, message: 'Enter both name and passkey!' };

  const profileRef = doc(db, 'profiles', localPlayerId);
  const profileSnap = await getDoc(profileRef);
  if (profileSnap.exists()) return { success: false, message: 'This device already has a profile.' };

  await setDoc(profileRef, { name: playerName, passkey });
  return { success: true };
}

/**
 * Reconnects to an existing profile using name and passkey.
 * Returns playerId if found, null otherwise.
 */
export async function reconnectWithPasskey(playerName, passkey) {
  if (!playerName || !passkey) return null;

  const profilesRef = collection(db, 'profiles');
  const q = query(profilesRef, where('name', '==', playerName), where('passkey', '==', passkey));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  } else {
    return null;
  }
}

/**
 * Checks if a profile already exists for a given playerId.
 * Returns profile data if exists, null otherwise.
 */
export async function checkProfile(localPlayerId) {
  const profileRef = doc(db, 'profiles', localPlayerId);
  const profileSnap = await getDoc(profileRef);
  return profileSnap.exists() ? profileSnap.data() : null;
}
