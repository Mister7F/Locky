export const EFF_WORD_COUNT = 7776

let cachedWords: Promise<readonly string[]> | undefined

export function loadEffWords(): Promise<readonly string[]> {
    if (!cachedWords) {
        cachedWords = fetch('wordlists/eff_large_wordlist.txt')
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Unable to load words: ${response.status}`)
                }
                return response.text()
            })
            .then((content) => {
                const lines = content.trim().split(/\r?\n/)
                const words = lines.map((line) => line.trim().split(/\s+/)[1])
                const uniqueWords = new Set(words)
                if (
                    words.length !== EFF_WORD_COUNT ||
                    uniqueWords.size !== EFF_WORD_COUNT ||
                    words.some((word) => !word)
                ) {
                    throw new Error('Invalid EFF word list')
                }
                return Object.freeze([...uniqueWords])
            })
            .catch((error) => {
                cachedWords = undefined
                throw error
            })
    }
    return cachedWords
}
