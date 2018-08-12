
/**
 * Generate a static keys string from compiler modules.
 */
export function genStaticKeys(modules) {
    return modules.reduce((keys, m) => {
        return keys.concat(m.staticKeys || [])
    }, []).join(',')
}