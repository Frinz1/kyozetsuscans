const express = require("express")
const path = require("path")
const cors = require("cors")
const { MangaAPI } = require("./mangakakalot")

const app = express()
const port = 3000

app.use(cors())
app.use(express.static("public"))

const mangaAPI = new MangaAPI()


app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        error: "Something went wrong!",
        message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    })
})

app.get("/api/latest-release", async (req, res, next) => {
    try {
        const result = await mangaAPI.latestRelease()
        res.json(result)
    } catch (error) {
        next(error)
    }
})

app.get("/api/search", async (req, res, next) => {
    const query = req.query.query
    if (!query) {
        return res.status(400).json({ error: "Query is required" })
    }
    try {
        const result = await mangaAPI.search(query)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

app.get("/api/manga/:id/chapters", async (req, res, next) => {
    const mangaId = req.params.id
    try {
        const chapters = await mangaAPI.getChapters(mangaId)
        res.json({ chapters })
    } catch (error) {
        next(error)
    }
})

app.get("/api/chapter/:id", async (req, res, next) => {
    const chapterId = req.params.id
    try {
        const pages = await mangaAPI.getChapterPages(chapterId)
        res.json({ pages })
    } catch (error) {
        next(error)
    }
})


app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

