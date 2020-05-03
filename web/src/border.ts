let border = new Border([borderDivCollection.bottom])
function setBorder(colour: ISettableColours = 'white') {
    if (colourOverride != '') {
        colour = colourOverride
    }

}

function setBorderClass(name: string) {
    const lastName = border.top.className.trim()
    const newName = name.trim()

    if (lastName === newName) return

    border.top.className = newName
    border.bottom.className = newName
    border.left.className = newName
    border.right.className = newName
}

class Border {
    private currentColour: ISettableColours = 'white'
    constructor(public pieces: HTMLElement[]) { }

    set colour(colour: ISettableColours) {
        if (colour != this.currentColour) {
            let tempClassName = 'border'

            this.currentColour = colour

            if (colour != 'white') {
                tempClassName += ` ${colour}-bg`
            }
            this.pieces.forEach(div => div.className = tempClassName)
        }
    }
    get colour() {
        return this.currentColour
    }
}