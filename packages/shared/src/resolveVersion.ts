
export const resolveVersion = (ternUIVersion: string | undefined, packageVersion = TERN_UI_VERSION) => {
    if (ternUIVersion) {
        return ternUIVersion
    }

    return packageVersion;
}