const ethers = require("ethers")
const Big = require('big.js')

/**
 * This file could be used for adding functions you
 * may need to call multiple times or as a way to
 * abstract logic from bot.js. Feel free to add
 * in your own functions you desire here!
 */

const IUniswapV2Pair = require("@uniswap/v2-core/build/IUniswapV2Pair.json")
const IERC20 = require('@openzeppelin/contracts/build/contracts/ERC20.json')

async function getTokenAndContract(_token0Address, _token1Address, _provider) {
    const token0Contract = new ethers.Contract(_token0Address, IERC20.abi, _provider)
    const token1Contract = new ethers.Contract(_token1Address, IERC20.abi, _provider)

    const token0 = {
        address: _token0Address,
        decimals: 18,
        symbol: await token0Contract.symbol(),
        name: await token0Contract.name()
    }

    const token1 = {
        address: _token1Address,
        decimals: 18,
        symbol: await token1Contract.symbol(),
        name: await token1Contract.name()
    }

    return { token0Contract, token1Contract, token0, token1 }
}

async function getPairAddress(_V2Factory, _token0, _token1) {
    const pairAddress = await _V2Factory.getPair(_token0, _token1)
    return pairAddress
}

async function getPairContract(_V2Factory, _token0, _token1, _provider) {
    const pairAddress = await getPairAddress(_V2Factory, _token0, _token1)
    const pairContract = new ethers.Contract(pairAddress, IUniswapV2Pair.abi, _provider)
    return pairContract
}

async function getReserves(_pairContract) {
    const reserves = await _pairContract.getReserves()
    return [reserves.reserve0, reserves.reserve1]
}

async function calculatePrice(_pairContract) {
    const [x, y] = await getReserves(_pairContract)
    return Big(x).div(Big(y))
}

async function calculateDifference(_uPrice, _sPrice) {
    return (((_uPrice - _sPrice) / _sPrice) * 100).toFixed(2)
}

async function simulate(_amount, _routerPath, _token0, _token1) {
    const trade1 = await _routerPath[0].getAmountsOut(_amount, [_token0.address, _token1.address])
    const trade2 = await _routerPath[1].getAmountsOut(trade1[1], [_token1.address, _token0.address])

    const amountIn = ethers.formatUnits(trade1[0], 'ether')
    const amountOut = ethers.formatUnits(trade2[1], 'ether')

    return { amountIn, amountOut }
}

module.exports = {
    getTokenAndContract,
    getPairAddress,
    getPairContract,
    getReserves,
    calculatePrice,
    calculateDifference,
    simulate
}