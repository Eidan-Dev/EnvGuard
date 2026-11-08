# Generate the demo GIF with https://github.com/charmbracelet/vhs
# Install: brew install vhs   |   Run from the repo root: vhs docs/demo.tape
Output docs/demo.gif

Set FontSize 18
Set Width 1000
Set Height 520
Set TypingSpeed 60ms
Set Theme "Dracula"

Type "cd example && node ../bin/envguard.js"
Sleep 500ms
Enter
Sleep 4s
