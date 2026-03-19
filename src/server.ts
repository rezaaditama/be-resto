import app from "./app";

const PORT = process.env.PORT || 3000;

const startServer = () => {
    try {
        app.listen(PORT, () => {
            console.log(`🚀 Server berjalan di http://localhost:${PORT}`)
        })
    } catch (error) {
        console.log(`❌ Gagal menjalankan server: ${error}`)
        process.exit(1);
    }
}

startServer();