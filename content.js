
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
let altPopupAnimation

const popup = (message, durationSeconds = 6) => {
    popupAnimation?.cancel()

    const logEl = document.getElementById('ok-buddy-log')
    logEl.textContent = message

    popupAnimation = fadeOut(logEl, durationSeconds * 1000)
    popupAnimation.onfinish = () => {
        logEl.textContent = ''
    }
}

const popupAlt = (message, durationSeconds = 4) => {
    altPopupAnimation?.cancel()

    const logEl = document.getElementById('ok-buddy-log-alt')
    logEl.textContent = message

    altPopupAnimation = fadeOut(logEl, durationSeconds * 1000)
    altPopupAnimation.onfinish = () => {
        logEl.textContent = ''
    }
}

const renderLog = () => {
    const logEl = document.createElement('div')
    logEl.id = 'ok-buddy-log'
    logEl.classList.add('ok-buddy-log-text')
    const logBoxEl = document.createElement('div')
    logBoxEl.classList.add('ok-buddy-log-box')
    logBoxEl.appendChild(logEl)
    return logBoxEl;
}

const renderAltLog = () => {
    const logEl = document.createElement('div')
    logEl.id = 'ok-buddy-log-alt'
    logEl.classList.add('ok-buddy-log-text')
    return logEl;
}

const highlightText = (terms, key) => {
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
    CSS.highlights.set(key, matchesHighlight)

    return termsTextNodes
}


let matchingNodes

const reviewProfile = async () => {
    const contentEl = document.querySelector('.desktop-dt-content')

    const rules = await chrome.runtime.sendMessage({ type: 'getRules' })
    const yayMatch = rules.yay.some(yRule => contentEl.textContent.includes(yRule))
    const nayMatch = rules.nay.some(nRule => contentEl.textContent.includes(nRule))

    matchingNodes = []
    if (nayMatch) {
        matchingNodes.push(...highlightText(rules.nay, 'nay-matches'))
    }
    if (yayMatch) {
        matchingNodes.push(...highlightText(rules.yay, 'yay-matches'))
    }

    if (yayMatch === nayMatch) {
        popup('❔')
    } else if (yayMatch) {
        popup('✅')
    } else if (nayMatch) {
        popup('❌')
    }
}

const likeProfile = () => {
    const profilePageSelector = '#like-button'
    const discoverPageSelector = '.dt-action-buttons-button.like'
    const likeButtonEl = document.querySelector([profilePageSelector, discoverPageSelector].join(','))
    likeButtonEl.click()
    popupAlt('👍', 1)
    setTimeout(reviewProfile, 50)
}

const passProfile = () => {
    const profilePageSelector = '#pass-button'
    const discoverPageSelector = '.dt-action-buttons-button.pass'
    const passButtonEl = document.querySelector([profilePageSelector, discoverPageSelector].join(','))
    passButtonEl.click()
    popupAlt('👎', 1)
    setTimeout(reviewProfile, 50)
}

const messageProfile = () => {
    const profilePageSelector = '.profile-pill-buttons-button.message-pill-button'
    const messageButtonEl = document.querySelector(profilePageSelector)
    messageButtonEl?.click()
    popupAlt('✏️', 1)
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
                scrollToElement(matchingNodes[0], -10)
                break;
            case 'Numpad2':
                location.reload()
                break;
            case 'Numpad0':
                messageProfile()
                break;
            default:
                break;
        }
    })
}

const render = () => {
    document.body.appendChild(renderLog())
    document.body.appendChild(renderAltLog())
}

const main = () => {
    render()
    bindHotkeys()
}

main();
