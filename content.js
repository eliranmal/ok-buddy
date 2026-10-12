
let rules
let popupAnimation
let termMatchNodes
let termIndex = 0


const homePageSelectors = {
    wrapper: '.desktop-dt-wrapper',
    profile: '.desktop-dt-content',
    details: '.dt-section',
    likeButton: '.dt-action-buttons-button.like',
    passButton: '.dt-action-buttons-button.pass',
}

const profilePageSelectors = {
    wrapper: '#profile',
    profile: '#profile',
    details: '.quickmatch-profiledetails.matchprofile-details',
    likeButton: '#like-button',
    passButton: '#pass-button',
    messageButton: '.profile-pill-buttons-button.message-pill-button',
}

const selectorsByPage = {
    'home': homePageSelectors,
    'discover': homePageSelectors,
    'profile': profilePageSelectors,
}


const getSelector = (key) => {
    const pageBasename = location.pathname.split('/').filter(Boolean).shift()
    const pageSelectors = selectorsByPage[pageBasename]
    return pageSelectors?.[key]
}

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

const popdown = () => {
    popupAnimation?.cancel()

    const logEl = document.getElementById('ok-buddy-log')
    logEl.textContent = ''
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

const reviewProfile = () => {
    const wrapperEl = document.querySelector(getSelector('wrapper'))
    const contentEl = document.querySelector(getSelector('profile'))

    const yayMatch = rules.yay.some(yRule => contentEl.textContent.includes(yRule))
    const nayMatch = rules.nay.some(nRule => contentEl.textContent.includes(nRule))
    const mehMatch = rules.meh.some(nRule => contentEl.textContent.includes(nRule))

    scrollToElement(wrapperEl)

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
    const likeButtonEl = document.querySelector(getSelector('likeButton'))
    likeButtonEl.click()
    popdown()
}
const passProfile = () => {
    const passButtonEl = document.querySelector(getSelector('passButton'))
    passButtonEl.click()
    popdown()
}

const messageProfile = () => {
    const messageButtonEl = document.querySelector(getSelector('messageButton'))
    messageButtonEl?.click()
}

const bindHotkeys = () => {
    document.addEventListener('keypress', (ev) => {
        if (!ev.metaKey) {
            return;
        }

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

const bindDomObserver = () => {
    const domMutationObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type !== 'childList' || !mutation.addedNodes.length) {
                continue
            }
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) {
                    return
                }
                const wrapperElAdded = node.matches(getSelector('wrapper'))
                const nestedDetailsElFound = node.querySelector(getSelector('details'))
                const detailsElAdded = node.matches(getSelector('details'))
                if (wrapperElAdded && nestedDetailsElFound || detailsElAdded) {
                    reviewProfile()
                }
            })
        }
    })

    domMutationObserver.observe(document.getElementById('root'), {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    })
}

const render = () => {
    document.body.appendChild(renderLog())
}

const loadRules = async () => {
    rules = await chrome.runtime.sendMessage({ type: 'getRules' })
}

const main = () => {
    render()
    loadRules()
    bindHotkeys()
    bindDomObserver()
}

main();
