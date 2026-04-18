import app from "./app";

const PORT = process.env.PORT || 3000;

const startServer = () => {
    try {
        app.listen(Number(PORT), "0.0.0.0", () => {
            console.log(`🚀 Server berjalan di port ${PORT} (Docker Ready)`)
        })
    } catch (error) {
        console.log(`❌ Gagal menjalankan server: ${error}`)
        process.exit(1);
    }
}

startServer();