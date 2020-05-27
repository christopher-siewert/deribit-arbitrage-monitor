function binarySearch(array, target, cmp = (a, b) => a - b) {
  if (array.length == 0) return 0
  let lo = 0
  let mid = 0
  let hi = array.length
  while (lo < hi) {
    mid = (lo + hi) >> 1
    if (cmp(array[mid], target) < 0) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  return lo
}
module.exports = binarySearch
