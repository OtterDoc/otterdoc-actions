export function ThisFunctionShouldNotGetCommented() {
  console.log('This is just a test function.')
  console.log(
    "It should not get commented since it's not part of the included files."
  )
}
