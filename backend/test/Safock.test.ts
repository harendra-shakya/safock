import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber, Wallet } from 'ethers'
import { ethers, waffle } from 'hardhat'
import { bn, fp } from '../common/numbers'
import {
  CTokenMock,
  ERC20Mock,
  FacadeRead,
  FacadeTest,
  StaticATokenMock,
  StRSRP1,
  TestIMain,
  TestIStRSR,
  TestIRToken,
  USDCMock,
  Safock,
  StakingToken,
} from '../typechain'
import { Collateral, Implementation, IMPLEMENTATION, defaultFixture } from './fixtures'

const createFixtureLoader = waffle.createFixtureLoader

describe('Safock contract', () => {
  let owner: SignerWithAddress
  let addr1: SignerWithAddress
  let addr2: SignerWithAddress
  let other: SignerWithAddress

  let safock: Safock
  // Tokens
  let initialBal: BigNumber
  let token: ERC20Mock
  let usdc: USDCMock
  let aToken: StaticATokenMock
  let cToken: CTokenMock
  let rsr: ERC20Mock
  let basket: Collateral[]

  // Assets
  let tokenAsset: Collateral
  let usdcAsset: Collateral
  let aTokenAsset: Collateral
  let cTokenAsset: Collateral

  // Facade
  let facade: FacadeRead
  let facadeTest: FacadeTest

  // Main
  let rToken: TestIRToken
  let main: TestIMain
  let stRSR: TestIStRSR

  let loadFixture: ReturnType<typeof createFixtureLoader>
  let wallet: Wallet

  let USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  let USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  let BUSD = '0x4Fabb145d64652a948d72533023f6E7A623C7C53'

  before('create fixture loader', async () => {
    ;[wallet] = (await ethers.getSigners()) as unknown as Wallet[]
    loadFixture = createFixtureLoader([wallet])
  })

  beforeEach(async () => {
    ;[owner, addr1, addr2, other] = await ethers.getSigners()

    // Deploy fixture
    ;({ stRSR, rsr, basket, facade, facadeTest, rToken, main } = await loadFixture(defaultFixture))

    // Get assets and tokens
    ;[tokenAsset, usdcAsset, aTokenAsset, cTokenAsset] = basket

    token = <ERC20Mock>await ethers.getContractAt('ERC20Mock', await tokenAsset.erc20())
    usdc = <USDCMock>await ethers.getContractAt('USDCMock', await usdcAsset.erc20())
    aToken = <StaticATokenMock>(
      await ethers.getContractAt('StaticATokenMock', await aTokenAsset.erc20())
    )
    cToken = <CTokenMock>await ethers.getContractAt('CTokenMock', await cTokenAsset.erc20())

    // Deploy Safock
    const SafockFactory = await ethers.getContractFactory('Safock')

    safock = <Safock>await SafockFactory.connect(owner).deploy(facade.address, USDC, USDT, BUSD) //
    await safock.deployed()
  })

  describe('Views', () => {
    let issueAmount: BigNumber

    beforeEach(async () => {
      await rToken.connect(owner).setIssuanceRate(fp('1'))

      // Mint Tokens
      initialBal = bn('10000000000e18')
      await token.connect(owner).mint(addr1.address, initialBal)
      await usdc.connect(owner).mint(addr1.address, initialBal)
      await aToken.connect(owner).mint(addr1.address, initialBal)
      await cToken.connect(owner).mint(addr1.address, initialBal)

      await token.connect(owner).mint(addr2.address, initialBal)
      await usdc.connect(owner).mint(addr2.address, initialBal)
      await aToken.connect(owner).mint(addr2.address, initialBal)
      await cToken.connect(owner).mint(addr2.address, initialBal)

      // Issue some RTokens
      issueAmount = bn('100e18')

      // Provide approvals
      await token.connect(addr1).approve(rToken.address, initialBal)
      await usdc.connect(addr1).approve(rToken.address, initialBal)
      await aToken.connect(addr1).approve(rToken.address, initialBal)
      await cToken.connect(addr1).approve(rToken.address, initialBal)

      // Issue rTokens
      await rToken.connect(addr1).issue(issueAmount)
    })

    it('Safock: Should return RToken price correctly', async () => {
      console.log(
        'Here is the price: ',
        ethers.utils.formatEther(await facade.price(rToken.address))
      )
      expect(await safock.getPrice(rToken.address)).to.equal(fp('1'))
    })
    it('stake correctly', async () => {
      const amount = ethers.utils.parseEther('10')
      await rToken.connect(addr1).approve(safock.address, amount)
      await safock.connect(addr1).stake(rToken.address, amount)

      const stk = await safock.getStakingContract(rToken.address)
      const stkToken = await ethers.getContractAt('StakingToken', stk)
      console.log('stkaddress', stk)
      const bal = await stkToken.connect(addr1).balanceOf(addr1.address)
      console.log('Here is the balance', ethers.utils.formatEther(bal))
      expect(bal).to.equal(amount)
    })

    it('unstake correctly', async () => {
      const amount = ethers.utils.parseEther('10')

      await rToken.connect(addr1).approve(safock.address, amount)
      await safock.connect(addr1).stake(rToken.address, amount)
      let stk = await safock.getStakingContract(rToken.address)
      let stkToken = await ethers.getContractAt('StakingToken', stk)
      console.log('stkaddress', stk)
      let bal = await stkToken.connect(addr1).balanceOf(addr1.address)
      console.log('Here is the balance', ethers.utils.formatEther(bal))

      await stkToken.connect(addr1).approve(safock.address, amount)

      await safock.connect(addr1).removeStake(rToken.address, amount)

      stk = await safock.getStakingContract(rToken.address)
      stkToken = await ethers.getContractAt('StakingToken', stk)
      console.log('stkaddress', stk)
      bal = await stkToken.connect(addr1).balanceOf(addr1.address)
      console.log('Here is the balance', ethers.utils.formatEther(bal))
      expect(bal).to.equal(0)
    })
  })
})
