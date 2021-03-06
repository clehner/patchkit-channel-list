import React from 'react'
import classNames from 'classnames'
import t from 'patchwork-translations'

function cls (selected, hasNew) {
  return classNames({ 'channel-list-item': true, flex: true, selected: selected, unread: hasNew })
}

class ChannelListItem extends React.Component {
  static contextTypes = {
    ssb: React.PropTypes.object,
    emit: React.PropTypes.func
  }

  shouldComponentUpdate(nextProps) {
    return this.props.selected !== nextProps.selected || this.props.channel !== nextProps.channel
  }

  onPin(e) {
    e.preventDefault()
    e.stopPropagation()
    this.context.ssb.patchwork.toggleChannelPinned(this.props.channel.name, err => {
      if (err)
        this.context.emit('error', err)
    })
  }

  render() {
    const channel = this.props.channel
    const onSelect = () => this.props.onSelect(channel)
    return <div className={cls(this.props.selected, channel.hasNew)} onClick={onSelect}>
      <div className="flex-fill"><i className="fa fa-hashtag" /> { channel.name }</div>
      <div className="ctrls">
        <a href='javascript:;' className={classNames({ pin: true, pinned: channel.pinned })} onClick={this.onPin.bind(this)}><i className="fa fa-thumb-tack" /></a>
      </div>
    </div>
  }
}

export default class ChannelList extends React.Component {
  static propTypes = {
    channels: React.PropTypes.array.isRequired,
    onSelect: React.PropTypes.func.isRequired,
    selected: React.PropTypes.string
  }
  static contextTypes = {
    ssb: React.PropTypes.object,
    emit: React.PropTypes.func
  }

  constructor(props) {
    super(props)
    this.state = { searchText: '', searchQuery: false }
  }

  onSearchChange(e) {
    const v = e.target.value
    this.setState({ searchText: v, searchQuery: (v) ? new RegExp(v, 'i') : false })
  }

  onSearchKeyDown(e) {
    if (e.keyCode == 13) {
      e.preventDefault()
      e.stopPropagation()
      if (this.state.searchText.trim())
        this.props.onSelect({ name: this.state.searchText })
      this.onClearSearch()
    }
  }

  onClearSearch() {
    this.setState({ searchText: '', searchQuery: false })
  }

  onClickOpen() {
    this.props.onSelect({ name: this.state.searchText })
    this.onClearSearch()
  }

  onClickCreate() {
    // Pin, then open
    this.context.ssb.patchwork.pinChannel(this.state.searchText, err => {
      if (err)
        return this.context.emit('error', err)
      this.props.onSelect({ name: this.state.searchText })
      this.onClearSearch()
    })
  }

  render() {
    const selected = this.props.selected
    const search = this.state.searchText

    // predicates
    const isPartialMatch = channel => ((this.state.searchQuery) ? this.state.searchQuery.test(channel.name) : true)
    const isExactMatch   = channel => ((this.state.searchText)  ? this.state.searchText === channel.name : false)
    const isPinned = b => channel => (!!channel.pinned == b)

    // filtered channels
    const pinnedChannels   = this.props.channels.filter(isPinned(true)).filter(isPartialMatch)
    const unpinnedChannels = this.props.channels.filter(isPinned(false)).filter(isPartialMatch)

    // render
    const hasExactMatch = this.props.channels.filter(isExactMatch).length > 0
    const renderChannel = channel => <ChannelListItem key={channel.name} channel={channel} selected={channel.name === selected} onSelect={this.props.onSelect} />
    return <div className="channel-list">
      <div className="channel-list-ctrls">
        <div className="search">
          <i className="fa fa-hashtag" />
          <input ref="searchInput" type="text" placeholder={t('channelList.NewChannel')} value={search} onChange={this.onSearchChange.bind(this)} onKeyDown={this.onSearchKeyDown.bind(this)} />
        </div>
      </div>
      { pinnedChannels.length ? <div className="channel-list-heading">{t('channelList.Channels')}</div> : '' }
      { pinnedChannels.map(renderChannel) }
      <hr/>
      { unpinnedChannels.map(renderChannel) }
      <hr/>
      <div style={{fontWeight: 'normal', color: 'gray', padding: '0 10px'}}>
        <p><small>{t('channelList.ChannelsInfo')}</small></p>
        <p>
          { search
            ? (hasExactMatch
              ? <small><a href='javascript:;' onClick={this.onClickOpen.bind(this)}>{t('channelList.Open', {channel: search})}</a> | </small>
              : <small><a href='javascript:;' onClick={this.onClickCreate.bind(this)}>{t('channelList.Create', {channel: search})}</a> | </small>)
            : '' }
          { search
            ? <small><a href='javascript:;' onClick={this.onClearSearch.bind(this)}>{t('channelList.ClearFilter')}</a></small>
            : '' }
        </p>
      </div>
    </div>
  }
}
