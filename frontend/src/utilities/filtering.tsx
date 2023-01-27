import { AllMethodsItem, MethodsItem } from "../redux/types"

export const filterMethodsType = (data: [] | AllMethodsItem[], type: string) => {
    return data.filter(d => d.type === type)
}

export const getMethodData = (data: [] | AllMethodsItem[], key: string) => {
    return data.filter(d => d.key.toLowerCase() === key.toLowerCase())[0]
}

export const getSingleItemByID = (data: AllMethodsItem, id: number) => {
    return data.data.filter(d => d.id === id)
}

export const getSingleItemByName = (data: AllMethodsItem, name: string) => {
    return data.data.filter(d => d.name.toLowerCase() === name.toLowerCase())[0]
}

export const getFilteredMethods = (array: AllMethodsItem, extension: string) => {
    return array.data.filter(a => a.extensions.includes(extension as never))
}
export const getAdditionalParameters = (methodItem: MethodsItem | null, extension: string) => {
    if (methodItem === null) return []
    return methodItem?.additional.filter(a => a.extension === extension)
}

export const removeFirst = (src: string[], element: string) => {
    const index = src.indexOf(element);
    if (index === -1) return src;
    return [...src.slice(0, index), ...src.slice(index + 1)];
}