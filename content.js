
let rules
let termNodes
let termIndex = 0


const defaultPageSelectors = {
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
    'home': defaultPageSelectors,
    'discover': defaultPageSelectors,
    'profile': profilePageSelectors,
}

const keyMap = {
    'Numpad8': () => {
        scrollToWrapper()
        reviewProfile()
    },
    'Numpad6': () => {
        scrollToWrapper()
        likeProfile()
    },
    'Numpad4': () => {
        scrollToWrapper()
        passProfile()
    },
    'Numpad5': () => {
        cycleMatchingTerms()
    },
    'Numpad2': () => {
        messageProfile()
    },
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

const scrollToWrapper = () => {
    const wrapperEl = document.querySelector(getSelector('wrapper'))
    scrollToElement(wrapperEl)
}

const renderLog = () => {
    const logTextEl1 = document.createElement('div')
    logTextEl1.classList.add('ok-buddy-log-text')
    const logTextEl2 = document.createElement('div')
    logTextEl2.classList.add('ok-buddy-log-text')
    const logTextEl3 = document.createElement('div')
    logTextEl3.classList.add('ok-buddy-log-text')

    const logBoxEl = document.createElement('div')
    logBoxEl.id = 'ok-buddy-log'
    logBoxEl.classList.add('ok-buddy-log-box')
    logBoxEl.appendChild(logTextEl1)
    logBoxEl.appendChild(logTextEl2)
    logBoxEl.appendChild(logTextEl3)

    return logBoxEl;
}

const logStatus = (statusTable) => {
    const logEl = document.getElementById('ok-buddy-log')
    const logTextEls = logEl.querySelectorAll('.ok-buddy-log-text')

    logTextEls.forEach((el, index) => {
        const [ status = '', count ] = statusTable[index] ?? []
        el.textContent = status
        // using '||' instead of default assignment for count, cause we wanna exclude '0'
        el.setAttribute('data-ok-buddy-counter', count || '')
    })
}

const clearStatusLog = () => {
    logStatus([[], [], []])
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
    const contentEl = document.querySelector(getSelector('profile'))

    const yayMatch = rules.yay.some(yRule => contentEl.textContent.includes(yRule))
    const nayMatch = rules.nay.some(nRule => contentEl.textContent.includes(nRule))
    const mehMatch = rules.meh.some(nRule => contentEl.textContent.includes(nRule))

    clearHighlightedText()

    const yayTermNodes = yayMatch ? highlightText(rules.yay, 'yay-matches') : []
    const nayTermNodes = nayMatch ? highlightText(rules.nay, 'nay-matches') : []
    const mehTermNodes = mehMatch ? highlightText(rules.meh, 'meh-matches') : []

    termIndex = 0
    termNodes = [
        ...yayTermNodes,
        ...nayTermNodes,
        ...mehTermNodes,
    ]

    const statusTable = !yayMatch && !nayMatch && !mehMatch ? [/* just a placeholder hole */, ['❔']] : [
        yayMatch ? ['✅', yayTermNodes.length] : [],
        mehMatch ? ['⚠️', mehTermNodes.length] : [],
        nayMatch ? ['❌', nayTermNodes.length] : [],
    ]

    logStatus(statusTable)
}

const cycleMatchingTerms = () => {
    if (!termNodes || !termNodes.length) {
        return
    }
    scrollToElement(termNodes[termIndex], -10)
    termIndex++
    if (termIndex >= termNodes.length) {
        termIndex = 0
    }
}

const likeProfile = () => {
    const likeButtonEl = document.querySelector(getSelector('likeButton'))
    likeButtonEl.click()
    clearStatusLog()
}
const passProfile = () => {
    const passButtonEl = document.querySelector(getSelector('passButton'))
    passButtonEl.click()
    clearStatusLog()
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
        keyMap[ev.code]?.()
    })
}

const bindDomObserver = () => {
    const domMutationObserver = new MutationObserver((mutationsList) => {
        const profileContentsAdded = mutationsList
            .filter(mutation => (
                mutation.type === 'childList' && mutation.addedNodes.length)
            )
            .some(mutation => (
                Array.from(mutation.addedNodes).some(node => (
                    // node is an element AND 'profile' container is the node's ancestor
                    node.nodeType === Node.ELEMENT_NODE && node.closest(getSelector('profile'))
                ))
            ))

        if (profileContentsAdded) {
            reviewProfile()
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

const loadSettings = async () => {
    const settings = await chrome.runtime.sendMessage({ type: 'getSettings' });
    let yay, nay, meh;
    rules = ({ yay, nay, meh } = settings);
}

const main = async () => {
    await loadSettings()
    render()
    bindHotkeys()
    bindDomObserver()
}

main();
