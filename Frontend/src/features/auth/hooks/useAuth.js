import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";
import toast from "react-hot-toast";


export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })

            if(!data || !data.user){
                toast.error("Invalid credentials")
                return false
            }
            setUser(data.user)
            toast.success("Login successful")
            return true
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Something went wrong"
            )
            console.log("Login error:", err)
            return false

        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            if(!data || !data.user){
                toast.error("Registration failed")
                return false
            }
            setUser(data.user)
            toast.success("Registration successful")
            return true
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Registration failed"
            )
            console.log("Registration error:", err)
            return false

        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            const data = await logout()

            setUser(null)
                toast.success("Logout successful")
        } catch (err) {
            toast.error("Something went wrong")
            console.log("Logout error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        const getAndSetUser = async () => {
            try {

                const data = await getMe()
                setUser(data.user)
            } catch (err) { } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    }, [])

    return { user, loading, handleRegister, handleLogin, handleLogout }

}