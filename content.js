
let popupAnimation
let termMatchNodes
let termIndex = 0

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

const popup = (message, durationSeconds) => {
    popupAnimation?.cancel()

    const logEl = document.getElementById('ok-buddy-log')
    logEl.textContent = message

    if (Number.isInteger(durationSeconds)) {
        popupAnimation = fadeOut(logEl, durationSeconds * 1000)
        popupAnimation.onfinish = () => {
            logEl.textContent = ''
        }
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

const clearHighlightedText = () => {
    if (!CSS.highlights) {
        console.log('css highlights not supported!')
        return
    }

    CSS.highlights.clear()
}

const highlightText = (terms, key) => {
    if (!CSS.highlights) {
        console.log('css highlights not supported!')
        return
    }

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

const reviewProfile = async () => {
    const profilePageSelector = '#profile'
    const discoverPageSelector = '.desktop-dt-content'
    const contentEl = document.querySelector([profilePageSelector, discoverPageSelector].join(','))

    const rules = await chrome.runtime.sendMessage({ type: 'getRules' })
    const yayMatch = rules.yay.some(yRule => contentEl.textContent.includes(yRule))
    const nayMatch = rules.nay.some(nRule => contentEl.textContent.includes(nRule))
    const mehMatch = rules.meh.some(nRule => contentEl.textContent.includes(nRule))

    clearHighlightedText()
    termIndex = 0
    termMatchNodes = []

    if (yayMatch) {
        termMatchNodes.push(...highlightText(rules.yay, 'yay-matches'))
    }
    if (nayMatch) {
        termMatchNodes.push(...highlightText(rules.nay, 'nay-matches'))
    }
    if (mehMatch) {
        termMatchNodes.push(...highlightText(rules.meh, 'meh-matches'))
    }

    const message = !yayMatch && !nayMatch && !mehMatch ? ' \n❔' : [
        yayMatch ? '✅' : ' ',
        mehMatch ? '🔔' : ' ',
        nayMatch ? '❌' : ' ',
    ].join('\n')

    popup(message)
}

const cycleMatchingTerms = () => {
    if (!termMatchNodes || !termMatchNodes.length) {
        return
    }
    scrollToElement(termMatchNodes[termIndex], -10)
    termIndex++
    if (termIndex >= termMatchNodes.length) {
        termIndex = 0
    }
}

const likeProfile = () => {
    const profilePageSelector = '#like-button'
    const discoverPageSelector = '.dt-action-buttons-button.like'
    const likeButtonEl = document.querySelector([profilePageSelector, discoverPageSelector].join(','))
    likeButtonEl.click()
    setTimeout(reviewProfile, 20)
}

const passProfile = () => {
    const profilePageSelector = '#pass-button'
    const discoverPageSelector = '.dt-action-buttons-button.pass'
    const passButtonEl = document.querySelector([profilePageSelector, discoverPageSelector].join(','))
    passButtonEl.click()
    setTimeout(reviewProfile, 20)
}

const messageProfile = () => {
    const profilePageSelector = '.profile-pill-buttons-button.message-pill-button'
    const messageButtonEl = document.querySelector(profilePageSelector)
    messageButtonEl?.click()
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
                cycleMatchingTerms()
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
}

const main = () => {
    render()
    bindHotkeys()
}

main();
