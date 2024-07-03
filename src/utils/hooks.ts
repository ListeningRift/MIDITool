import { computed } from 'vue'

export function useVModel<P extends object, K extends keyof P, Name extends string>(propertyName: K, emits: (name: Name, ...args: any[]) => void, props: P) {
  const eventName = `update:${propertyName!.toString()}` as Name
  return computed({
    get() {
      return props[propertyName]
    },
    set(value) {
      emits(eventName, value)
    }
  })
}
