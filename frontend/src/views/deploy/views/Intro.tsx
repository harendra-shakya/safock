import { t } from '@lingui/macro'
import DeployHeader from '../components/DeployHeader'
import DeployIntro from '../components/DeployIntro'

const Intro = () => (
  <>
    <DeployHeader
      title={t`Create New ETF`}
      subtitle="First configure your ETF collateral basket parameters, then in second transaction, set up governance."
      confirmText={t`Start`}
    />
    <DeployIntro />
  </>
)

export default Intro
