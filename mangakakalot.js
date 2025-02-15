const axios = require("axios")

class MangaAPI {
    constructor() {
        this.baseUrl = "https://api.mangadex.org"
    }

    async latestRelease() {
        try {
            const response = await axios.get(`${this.baseUrl}/manga`, {
                params: {
                    limit: 20,
                    offset: 0,
                    order: {
                        updatedAt: "desc",
                    },
                    includes: ["cover_art"],
                },
            })

            const mangaList = await Promise.all(
                response.data.data.map(async (manga) => {
                    const coverFile = manga.relationships.find((rel) => rel.type === "cover_art")?.attributes?.fileName
                    const chapters = await this.getChapters(manga.id)

                    return {
                        id: manga.id,
                        img: coverFile
                            ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}`
                            : "/placeholder.svg?height=200&width=150",
                        title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
                        description: manga.attributes.description?.en,
                        status: manga.attributes.status,
                        chapters: chapters,
                    }
                }),
            )

            return { results: mangaList }
        } catch (error) {
            console.error("Error fetching latest releases:", error)
            return { results: [] }
        }
    }

    async search(query) {
        try {
            const response = await axios.get(`${this.baseUrl}/manga`, {
                params: {
                    limit: 20,
                    offset: 0,
                    title: query,
                    includes: ["cover_art"],
                },
            })

            const mangaList = await Promise.all(
                response.data.data.map(async (manga) => {
                    const coverFile = manga.relationships.find((rel) => rel.type === "cover_art")?.attributes?.fileName
                    const chapters = await this.getChapters(manga.id)

                    return {
                        id: manga.id,
                        img: coverFile
                            ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}`
                            : "/placeholder.svg?height=200&width=150",
                        title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
                        description: manga.attributes.description?.en,
                        status: manga.attributes.status,
                        chapters: chapters,
                    }
                }),
            )

            return { results: mangaList }
        } catch (error) {
            console.error("Error searching manga:", error)
            return { results: [] }
        }
    }

    async getChapters(mangaId) {
        try {
            const response = await axios.get(`${this.baseUrl}/manga/${mangaId}/feed`, {
                params: {
                    limit: 500,
                    translatedLanguage: ["en"],
                    order: { chapter: "asc" },
                    includes: ["scanlation_group"],
                    contentRating: ["safe", "suggestive", "erotica"],
                },
            })

            const chapters = response.data.data
                .filter((chapter) => chapter.attributes.chapter) // Only include chapters with numbers
                .map((chapter) => ({
                    id: chapter.id,
                    chapter: chapter.attributes.chapter,
                    title: chapter.attributes.title || `Chapter ${chapter.attributes.chapter}`,
                    pages: chapter.attributes.pages,
                    publishedAt: chapter.attributes.publishAt,
                    group: chapter.relationships?.find((rel) => rel.type === "scanlation_group")?.attributes?.name,
                }))
                .sort((a, b) => Number.parseFloat(a.chapter) - Number.parseFloat(b.chapter))

            return chapters
        } catch (error) {
            console.error("Error fetching chapters:", error)
            if (error.response) {
                console.error("API Response:", error.response.data)
            }
            return []
        }
    }

    async getChapterPages(chapterId) {
        try {
            const response = await axios.get(`${this.baseUrl}/at-home/server/${chapterId}`)
            const baseUrl = response.data.baseUrl
            const chapterHash = response.data.chapter.hash
            const pageFilenames = response.data.chapter.data

            return pageFilenames.map((filename) => `${baseUrl}/data/${chapterHash}/${filename}`)
        } catch (error) {
            console.error("Error fetching chapter pages:", error)
            return []
        }
    }
}

module.exports = { MangaAPI }

