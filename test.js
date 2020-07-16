let state = {'hi': 5, 'h': 4}

for (const [key, value] of Object.entries(state)) {
  console.log(key, value)
}
