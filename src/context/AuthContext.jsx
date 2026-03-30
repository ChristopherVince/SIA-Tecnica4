import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Carga nombre y rol desde Firestore: colección "usuarios", doc = uid
        try {
          const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
          if (snap.exists()) {
            const { nombre, rol } = snap.data()
            console.log('✅ Usuario encontrado:', { nombre, rol, uid: firebaseUser.uid })
            setCurrentUser({ ...firebaseUser, nombre, rol })
          } else {
            // El usuario existe en Auth pero no tiene documento en Firestore
            console.warn('⚠️ Usuario en Auth pero NO en Firestore:', firebaseUser.uid)
            setCurrentUser({ ...firebaseUser, nombre: firebaseUser.email, rol: null })
          }
        } catch (error) {
          console.error('❌ Error cargando datos de Firestore:', error)
          setCurrentUser({ ...firebaseUser, nombre: firebaseUser.email, rol: null })
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
