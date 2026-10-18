import { normalizeOrigin } from '../helpers/utils'
import type { FieldType } from '../helpers/types.ts'

const FIELD_TYPES: FieldType[] = [
    'text',
    'text-multiline',
    'password',
    'email',
    'url',
    'totp',
]

function isFieldType(value: unknown): value is FieldType {
    return FIELD_TYPES.some((type) => type === value)
}

type AccountKey = 'name' | 'login' | 'password' | 'url' | 'totp'

const ACCOUNT_FIELDS: [AccountKey, string, FieldType][] = [
    ['name', 'Name', 'text'],
    ['login', 'Login', 'text'],
    ['password', 'Password', 'password'],
    ['url', 'URL', 'url'],
    ['totp', '2FA', 'totp'],
]

export default class Account {
    private __brand!: 'Account'
    id?: string
    name?: string
    login?: string
    password?: string
    folder_id: string
    url?: string
    icon?: string
    totp?: string
    fields: Field[]
    in_trash: boolean
    history: HistoryEntry[]

    constructor(
        id?: string,
        name?: string,
        login?: string,
        password?: string,
        folder_id?: string,
        url?: string,
        icon?: string,
        totp?: string,
        fields?: Field[],
        in_trash?: boolean,
        history?: HistoryEntry[]
    ) {
        this.id = id || crypto.randomUUID()
        this.name = name || ''
        this.login = login || ''
        this.password = password || ''
        this.folder_id = folder_id || ''
        this.url = url || ''
        this.icon = icon || ''
        this.totp = totp || ''
        this.fields = fields || []
        this.in_trash = in_trash === true
        this.history = history || []
    }

    static fromJson(values: any): Account {
        return new Account(
            values.id,
            values.name,
            values.login,
            values.password,
            values.folder_id,
            values.url,
            values.icon,
            values.totp,
            (values.fields || []).map((f) => Field.fromJson(f)),
            values.in_trash,
            (values.history || []).map((h) => HistoryEntry.fromJson(h))
        )
    }

    get urls(): string[] {
        const urls = this.fields
            .filter((f) => f.type === 'url' && f.value)
            .map((f) => normalizeOrigin(f.value))
        if (this.url?.length) {
            urls.push(normalizeOrigin(this.url))
        }
        return urls
    }

    get searchableTerms(): string[] {
        return [this.name, ...this.urls]
    }
}

export class Field {
    private __brand!: 'Field'
    name: string
    type: FieldType
    value?: string

    constructor(name?: string, type?: FieldType, value?: string) {
        this.name = name || ''
        this.type = type || 'text'
        this.value = value || ''
    }

    static fromJson(values: any): Field {
        return new Field(
            values.name,
            isFieldType(values.type) ? values.type : 'text',
            values.value
        )
    }
}

export class HistoryEntry {
    private __brand!: 'HistoryEntry'
    id: string
    name: string
    type: FieldType
    value: string
    date: string

    constructor(
        id?: string,
        name?: string,
        type?: FieldType,
        value?: string,
        date?: string
    ) {
        this.id = id || crypto.randomUUID()
        this.name = name || ''
        this.type = type || 'text'
        this.value = value || ''
        this.date = date || new Date().toISOString()
    }

    static fromJson(values: any): HistoryEntry {
        return new HistoryEntry(
            values.id,
            values.name,
            isFieldType(values.type) ? values.type : 'text',
            values.value,
            values.date
        )
    }

    /**
     * Values of `before` that are lost in `after` (changed or removed).
     */
    static diff(before: Account, after: Account): HistoryEntry[] {
        const lost: Field[] = ACCOUNT_FIELDS.filter(
            ([key]) => before[key] && before[key] !== after[key]
        ).map(([key, name, type]) => new Field(name, type, before[key]))

        // custom fields can share a name, each new field matches one old field
        const remaining = [...after.fields]
        for (const field of before.fields) {
            const index = remaining.findIndex(
                (f) => f.name === field.name && f.value === field.value
            )
            if (index >= 0) {
                remaining.splice(index, 1)
            } else if (field.value) {
                lost.push(field)
            }
        }

        return lost.map(
            ({ name, type, value }) =>
                new HistoryEntry(undefined, name, type, value)
        )
    }
}
