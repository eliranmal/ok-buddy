
const scrollToElement = (node, yOffset = 0) => {
    if (!node) {
        return
    }
    const el = node.nodeName === '#text' ? node.parentElement : node
    el.scrollIntoView()
    scrollBy(0, -60 + yOffset) // accommodate for page header height
}

const fadeOut = (el, duration) => {
    return el.animate(
        [
            { opacity: '1' },
            { opacity: '0' },
        ], {
            fill: 'forwards',
            delay: duration * .67,
            duration: duration * .33,
            iterations: 1,
            timingFunction: 'ease-in',
        });
}

let popupAnimation

const popup = (message, timeoutSeconds = 4) => {
    popupAnimation?.cancel()

    const logEl = document.getElementById('ok-buddy-log')
    logEl.textContent = message

    popupAnimation = fadeOut(logEl, timeoutSeconds * 1000)
    popupAnimation.onfinish = () => {
        logEl.textContent = ''
    }
}

const createLogBox = () => {
    const logEl = document.createElement('div')
    logEl.id = 'ok-buddy-log'
    logEl.classList.add('ok-buddy-log-text')
    const logBoxEl = document.createElement('div')
    logBoxEl.classList.add('ok-buddy-log-box')
    logBoxEl.appendChild(logEl)
    return logBoxEl;
}

const highlightText = (terms, selector) => {
    if (!CSS.highlights) {
        console.log('css highlights not supported!')
        return
    }

    CSS.highlights.clear()

    const domWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, node => (
        terms.some(t => node.data.includes(t)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    ))

    const termsTextNodes = []
    while (domWalker.nextNode()) {
        termsTextNodes.push(domWalker.currentNode)
    }

    const ranges = termsTextNodes.map(node => {
        const range = document.createRange()
        const term = terms.find(t => node.data.includes(t))
        range.setStart(node, node.data.indexOf(term))
        range.setEnd(node, node.data.indexOf(term) + term.length)
        return range
    })

    const matchesHighlight = new Highlight(...ranges)
    CSS.highlights.set(selector, matchesHighlight)

    return termsTextNodes
}

const reviewProfile = async () => {
    const detailsEl = document.querySelector('.matchprofile-details')

    const rules = await chrome.runtime.sendMessage({ type: 'getRules' })
    const yayMatch = rules.yay.some(yRule => detailsEl.textContent.includes(yRule))
    const nayMatch = rules.nay.some(nRule => detailsEl.textContent.includes(nRule))

    if (nayMatch) {
        popup('❌')
        const matchingNodes = highlightText(rules.nay, 'nay-matches')
        scrollToElement(matchingNodes[0], -10)
    } else if (yayMatch) {
        popup('✅')
        const matchingNodes = highlightText(rules.yay, 'yay-matches')
        scrollToElement(matchingNodes[0], -10)
    } else {
        popup('❔')
    }
}

const likeProfile = () => {
    const profilePageSelector = '#like-button'
    const discoverPageSelector = '.dt-action-buttons-button.like'
    const likeButtonEl = document.querySelector([profilePageSelector, discoverPageSelector].join(','))
    likeButtonEl.click()
    popup('👍', 1)
}

const passProfile = () => {
    const profilePageSelector = '#pass-button'
    const discoverPageSelector = '.dt-action-buttons-button.pass'
    const passButtonEl = document.querySelector([profilePageSelector, discoverPageSelector].join(','))
    passButtonEl.click()
    popup('👎', 1)
}

const messageProfile = () => {
    const profilePageSelector = '.profile-pill-buttons-button.message-pill-button'
    const messageButtonEl = document.querySelector(profilePageSelector)
    messageButtonEl?.click()
    popup('✏️', 1)
}

const bindHotkeys = () => {
    document.addEventListener('keypress', (ev) => {
        if (!ev.metaKey) {
            return;
        }

        scrollToElement(document.querySelector('.desktop-dt-wrapper'))

        switch (ev.code) {
            case 'Numpad8':
                reviewProfile()
                break;
            case 'Numpad6':
                likeProfile()
                break;
            case 'Numpad4':
                passProfile()
                break;
            case 'Numpad5':
                messageProfile()
                break;
            case 'Numpad2':
                location.reload()
                break;
            default:
                break;
        }
    })
}

const render = () => {
    document.body.appendChild(createLogBox())
}

const main = () => {
    render()
    bindHotkeys()
}

main();
