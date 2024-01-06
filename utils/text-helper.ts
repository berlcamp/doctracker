export function fullTextQuery (string: string): string {
  // const isStringAllNumbers = (str: string) => {
  //   return /^\d+$/.test(str)
  // }

  // if (isStringAllNumbers(string)) {
  //   return parseInt(string, 10)
  // }

  const searchSplit = string.split(' ')

  const keywordArray: any[] = []
  searchSplit.forEach(item => {
    if (item !== '') keywordArray.push(`'${item}'`)
  })
  const searchQuery = keywordArray.join(' & ')

  return searchQuery
}

export function capitalizeWords (inputString: string) {
  return inputString
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function generateReferenceCode () {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const charactersLength = characters.length
  let counter = 0
  while (counter < 8) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}
